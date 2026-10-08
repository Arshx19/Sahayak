"""Deterministic Explainable Eligibility Routes (/eligibility).

Evaluates scheme eligibility deterministically by comparing citizen demographic profile
and verified locker documents against rule conditions and scheme requirements.
Persists audit snapshot via backend/DB/crud.save_eligibility_check.
"""

import json
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, status

try:
    from AI.rules_engine.profile_merger import merge_extracted_documents
    from AI.rules_engine.evaluator import SchemeEvaluator
    from AI.rules_engine.ranker import rank_schemes
except ImportError:
    try:
        from backend.AI.rules_engine.profile_merger import merge_extracted_documents
        from backend.AI.rules_engine.evaluator import SchemeEvaluator
        from backend.AI.rules_engine.ranker import rank_schemes
    except ImportError:
        merge_extracted_documents = None
        SchemeEvaluator = None
        rank_schemes = None

try:
    from schemas.eligibility import (
        EligibilityCheckRequest,
        CriterionResult,
        EligibilityResultData,
        EligibilityResponse,
        MySchemesResponse,
    )
    from auth.dependencies import get_current_user
except ImportError:
    from crud.schemas.eligibility import (
        EligibilityCheckRequest,
        CriterionResult,
        EligibilityResultData,
        EligibilityResponse,
        MySchemesResponse,
    )
    from crud.auth.dependencies import get_current_user

try:
    from DB.connection import get_db
    from DB import crud, schemas
except ImportError:
    from backend.DB.connection import get_db
    from backend.DB import crud, schemas

router = APIRouter()

# Scheme identifier aliases
SCHEME_ID_ALIASES = {
    "pm_kisan": "CEN001",
    "pm-kisan": "CEN001",
    "pm_jay": "CEN002",
    "pm-jay": "CEN002",
    "pmjay": "CEN002",
    "pmay_g": "CEN003",
    "pm_svanidhi": "CEN004",
    "pm_mudra": "CEN005",
    "pmkvy": "CEN006",
    "pmsby": "CEN007",
    "pmjjby": "CEN008",
    "apy": "CEN009",
    "ssy": "CEN010",
}

# Document Key Aliases for matching
DOCUMENT_ALIASES = {
    "photo": "photograph",
    "photograph": "photo",
    "bank_passbook": "bank_account",
    "bank_account": "bank_passbook",
    "income_cert": "income_certificate",
    "income_certificate": "income_cert",
    "caste_cert": "caste_certificate",
    "caste_certificate": "caste_cert",
    "domicile": "domicile_certificate",
    "domicile_certificate": "domicile",
    "land_records": "land_record",
    "land_record": "land_records",
}


def _load_fallback_rules(scheme_id: str) -> Optional[Dict[str, Any]]:
    """Load rule set from seed JSON when database is unseeded or offline."""
    try:
        seeds_dir = Path(__file__).resolve().parent.parent.parent / "DB" / "seeds"
        seed_path = seeds_dir / "rules_data.json"
        if seed_path.exists():
            with open(seed_path, "r", encoding="utf-8") as f:
                all_rules = json.load(f)
            clean_id = scheme_id.strip().lower().replace("-", "_")
            alt_id = SCHEME_ID_ALIASES.get(clean_id, clean_id).lower()
            for r in all_rules:
                rid = (r.get("scheme_id") or "").lower().replace("-", "_")
                if rid in (clean_id, alt_id):
                    return r
    except Exception:
        pass
    return None


def _evaluate_operator(actual: Any, expected: Any, operator: str) -> bool:
    """Evaluate mathematical, equality, or set condition deterministically."""
    if operator == "==":
        if isinstance(actual, str) and isinstance(expected, str):
            return actual.strip().lower() == expected.strip().lower()
        return actual == expected
    elif operator == "!=":
        if isinstance(actual, str) and isinstance(expected, str):
            return actual.strip().lower() != expected.strip().lower()
        return actual != expected
    elif operator == "<=":
        try:
            return float(actual) <= float(expected)
        except (ValueError, TypeError):
            return False
    elif operator == ">=":
        try:
            return float(actual) >= float(expected)
        except (ValueError, TypeError):
            return False
    elif operator == "<":
        try:
            return float(actual) < float(expected)
        except (ValueError, TypeError):
            return False
    elif operator == ">":
        try:
            return float(actual) > float(expected)
        except (ValueError, TypeError):
            return False
    elif operator == "in":
        if isinstance(expected, list):
            clean_expected = [str(x).lower().strip() for x in expected]
            return str(actual).lower().strip() in clean_expected or "all" in clean_expected
        return str(actual).lower().strip() == str(expected).lower().strip()
    elif operator == "not_in":
        if isinstance(expected, list):
            clean_expected = [str(x).lower().strip() for x in expected]
            return str(actual).lower().strip() not in clean_expected
        return str(actual).lower().strip() != str(expected).lower().strip()
    return False


@router.post(
    "/check",
    status_code=status.HTTP_200_OK,
    summary="Evaluate citizen eligibility for a scheme deterministically",
)
async def check_eligibility(
    payload: EligibilityCheckRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """
    Verify citizen eligibility deterministically:
    1. Evaluates required document possession against citizen verified locker documents.
    2. Evaluates socio-economic demographic criteria (age, income, land, state, occupation).
    3. Produces explainable checklist with machine-readable results.
    4. Persists evaluation audit snapshot via crud.save_eligibility_check.
    """
    user_id = current_user["user_id"]
    scheme_id = payload.scheme_id.strip()
    canonical_scheme_id = SCHEME_ID_ALIASES.get(scheme_id.lower().replace("-", "_"), scheme_id)

    # 1. Fetch citizen profile
    profile = None
    try:
        profile = await crud.get_citizen_profile(db, user_id)
    except Exception:
        pass

    effective_profile = dict(profile or {})
    if payload.profile_override:
        effective_profile.update(payload.profile_override)

    # Fill default profile heuristics if empty
    if "annual_income" not in effective_profile and "income" in effective_profile:
        effective_profile["annual_income"] = effective_profile["income"]
    effective_profile.setdefault("occupation", "farmer")
    effective_profile.setdefault("annual_income", 120000.0)
    effective_profile.setdefault("land_acres", 2.0)
    effective_profile.setdefault("state", "Maharashtra")
    effective_profile.setdefault("age", 35)

    # 2. Fetch scheme metadata
    scheme_info = None
    try:
        scheme_info = await crud.get_scheme_by_id(db, canonical_scheme_id)
    except Exception:
        pass

    if not scheme_info:
        # Try direct lookup with query id
        try:
            scheme_info = await crud.get_scheme_by_id(db, scheme_id)
        except Exception:
            pass

    scheme_name = (
        (scheme_info.get("name") or scheme_info.get("scheme_name"))
        if scheme_info
        else scheme_id.upper().replace("_", "-")
    )
    required_docs = scheme_info.get("required_documents", []) if scheme_info else []

    # 3. Fetch verified user documents from locker
    verified_doc_types: List[str] = []
    try:
        verified_doc_types = await crud.get_user_verified_document_types(db, user_id)
    except Exception:
        pass

    # Normalize verified docs set for alias matching
    verified_docs_normalized = set()
    for d in verified_doc_types:
        cd = str(d).strip().lower().replace("-", "_")
        verified_docs_normalized.add(cd)
        if cd in DOCUMENT_ALIASES:
            verified_docs_normalized.add(DOCUMENT_ALIASES[cd])

    # 4. Fetch scheme rules
    rules_doc = None
    try:
        rules_doc = await crud.get_scheme_rules(db, canonical_scheme_id)
        if not rules_doc:
            rules_doc = await crud.get_scheme_rules(db, scheme_id)
    except Exception:
        pass

    if not rules_doc:
        rules_doc = _load_fallback_rules(canonical_scheme_id) or _load_fallback_rules(scheme_id)

    # 5. Deterministic Evaluation Engine
    criteria_results = []
    missing_docs = []
    reasons = []

    # 5a. Document Verification Criteria
    # Merge required docs from scheme model and rules
    docs_to_check = set(required_docs)
    if rules_doc and "rules" in rules_doc:
        for r in rules_doc["rules"]:
            if r.get("field") == "documents" or r.get("operator") == "has_document":
                docs_to_check.add(str(r.get("value", "")).strip().lower())

    for doc_type in docs_to_check:
        clean_doc = str(doc_type).strip().lower().replace("-", "_")
        alias_doc = DOCUMENT_ALIASES.get(clean_doc, clean_doc)
        has_doc = (clean_doc in verified_docs_normalized) or (alias_doc in verified_docs_normalized)

        doc_display_name = clean_doc.replace("_", " ").title()

        if has_doc:
            criteria_results.append({
                "field": clean_doc,
                "criterion": clean_doc,
                "passed": True,
                "status": "passed",
                "operator": "has_document",
                "required": f"Verified {doc_display_name}",
                "expected": clean_doc,
                "actual": "Verified in Locker",
                "user_value": "Verified",
                "required_value": clean_doc,
                "reason": f"{doc_display_name} uploaded and verified",
                "explanation": f"Mandatory document: {doc_display_name}",
            })
        else:
            missing_docs.append(clean_doc)
            fail_reason = f"{doc_display_name} has not been uploaded"
            reasons.append(fail_reason)
            criteria_results.append({
                "field": clean_doc,
                "criterion": clean_doc,
                "passed": False,
                "status": "missing",
                "operator": "has_document",
                "required": f"Verified {doc_display_name}",
                "expected": clean_doc,
                "actual": "Missing",
                "user_value": None,
                "required_value": clean_doc,
                "reason": fail_reason,
                "explanation": f"Mandatory document: {doc_display_name}",
            })

    # 5b. Demographic Rules Evaluation
    rule_conditions = rules_doc.get("rules", []) if rules_doc else []
    for cond in rule_conditions:
        field = cond.get("field")
        op = cond.get("operator", "==")
        expected_val = cond.get("value")
        explanation = cond.get("explanation") or f"Rule on {field}"

        # Skip document rules already checked in 5a
        if field == "documents" or op == "has_document":
            continue

        actual_val = effective_profile.get(field)
        # Handle field aliases (e.g. income vs annual_income)
        if actual_val is None and field == "annual_income":
            actual_val = effective_profile.get("income")
        elif actual_val is None and field == "income":
            actual_val = effective_profile.get("annual_income")

        passed = False
        if actual_val is not None:
            passed = _evaluate_operator(actual_val, expected_val, op)

        if passed:
            criteria_results.append({
                "field": field,
                "criterion": field,
                "passed": True,
                "status": "passed",
                "operator": op,
                "required": f"{op} {expected_val}",
                "expected": expected_val,
                "actual": actual_val,
                "user_value": actual_val,
                "required_value": expected_val,
                "reason": explanation,
                "explanation": explanation,
            })
        else:
            fail_msg = f"{field} requirement not met: expected {op} {expected_val}, got {actual_val}"
            reasons.append(explanation if explanation else fail_msg)
            criteria_results.append({
                "field": field,
                "criterion": field,
                "passed": False,
                "status": "failed",
                "operator": op,
                "required": f"{op} {expected_val}",
                "expected": expected_val,
                "actual": actual_val,
                "user_value": actual_val,
                "required_value": expected_val,
                "reason": explanation if explanation else fail_msg,
                "explanation": explanation,
            })

    # If no demographic rules found, evaluate state applicability from scheme
    if scheme_info and not any(c["field"] == "state" for c in criteria_results):
        app_states = scheme_info.get("applicable_states", ["ALL"])
        user_state = effective_profile.get("state", "Maharashtra")
        state_match = "ALL" in [s.upper() for s in app_states] or user_state in app_states

        if state_match:
            criteria_results.append({
                "field": "state",
                "criterion": "state",
                "passed": True,
                "status": "passed",
                "operator": "in",
                "required": f"Domicile in {', '.join(app_states)}",
                "expected": app_states,
                "actual": user_state,
                "user_value": user_state,
                "required_value": app_states,
                "reason": f"Citizen state ({user_state}) is eligible",
                "explanation": "State residency requirement",
            })
        else:
            fail_msg = f"Scheme applies to {', '.join(app_states)}, your state is {user_state}"
            reasons.append(fail_msg)
            criteria_results.append({
                "field": "state",
                "criterion": "state",
                "passed": False,
                "status": "failed",
                "operator": "in",
                "required": f"Domicile in {', '.join(app_states)}",
                "expected": app_states,
                "actual": user_state,
                "user_value": user_state,
                "required_value": app_states,
                "reason": fail_msg,
                "explanation": "State residency requirement",
            })

    # 6. Overall Eligibility Aggregation
    is_eligible = all(c["passed"] for c in criteria_results) if criteria_results else True
    if is_eligible and not reasons:
        reasons = [f"Citizen satisfies all eligibility and documentation criteria for {scheme_name}."]

    overall_explanation = (
        f"Eligible for {scheme_name}. All primary eligibility criteria and documents satisfied."
        if is_eligible
        else f"Ineligible for {scheme_name}: " + "; ".join(reasons[:2])
    )

    check_record = {
        "check_id": f"chk_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "scheme": scheme_name,
        "scheme_id": scheme_id,
        "scheme_name": scheme_name,
        "is_eligible": is_eligible,
        "eligible": is_eligible,
        "criteria": criteria_results,
        "criteria_results": criteria_results,
        "reasons": reasons,
        "missing_documents": missing_docs,
        "required_documents": list(docs_to_check),
        "explanation": overall_explanation,
        "profile_snapshot": effective_profile,
        "documents_snapshot": list(verified_docs_normalized),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # 7. Persist audit snapshot via DB repository
    try:
        await crud.save_eligibility_check(db, check_record)
    except Exception:
        pass

    return {
        "success": True,
        "data": check_record,
    }


@router.get(
    "/my-schemes",
    status_code=status.HTTP_200_OK,
    summary="Get user's eligible and ineligible schemes history",
)
async def get_my_schemes(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve schemes classified by eligibility for the logged-in citizen."""
    user_id = current_user["user_id"]

    eligible = []
    ineligible = []

    try:
        eligible = await crud.get_eligible_schemes_for_user(db, user_id)
        ineligible = await crud.get_non_eligible_schemes_for_user(db, user_id)
    except Exception:
        pass

    return {
        "success": True,
        "data": {
            "eligible": eligible or [],
            "ineligible": ineligible or [],
        },
    }


def _load_enhanced_schemes() -> List[Dict[str, Any]]:
    """Load sample data-driven schemes from enhanced_schemes.json."""
    try:
        seeds_path = Path(__file__).resolve().parent.parent.parent / "DB" / "seeds" / "enhanced_schemes.json"
        if seeds_path.exists():
            with open(seeds_path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return []


@router.post(
    "/evaluate-profile",
    status_code=status.HTTP_200_OK,
    summary="Evaluate unified applicant profile against data-driven scheme rules",
)
async def evaluate_applicant_profile(
    payload: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """
    Synthesizes a UnifiedApplicantProfile from extracted documents and evaluates
    against data-driven scheme rules, returning ranked eligibility outcomes:
    {
      "scheme_id": "...",
      "status": "eligible|not_eligible|needs_info",
      "passed": [...],
      "failed": [...],
      "unverified": [...],
      "missing_documents": [...]
    }
    """
    if merge_extracted_documents is None or SchemeEvaluator is None:
        return {
            "success": False,
            "message": "Rules engine module is not loaded on this server",
            "evaluations": [],
        }

    user_id = current_user["user_id"]
    extracted_docs = payload.get("extracted_documents", [])
    supplemental = payload.get("supplemental_profile", {})
    target_scheme_ids = payload.get("scheme_ids")

    # If no extracted docs passed explicitly, load from user's locker
    if not extracted_docs:
        try:
            user_docs = await crud.get_user_documents(db, user_id)
            if user_docs:
                for ud in user_docs:
                    meta = ud.get("metadata", {})
                    extracted_fields = meta.get("extracted_fields", {})
                    fields_fmt = {}
                    for fn, fv in extracted_fields.items():
                        fields_fmt[fn] = {"value": fv, "confidence": 0.90, "source": "locker"}
                    extracted_docs.append({
                        "doc_type": ud.get("document_type"),
                        "fields": fields_fmt,
                        "needs_review": meta.get("needs_review", []),
                        "validation_errors": meta.get("validation_errors", []),
                    })
        except Exception:
            pass

    # 1. Merge into unified applicant profile
    unified_profile = merge_extracted_documents(
        extracted_docs=extracted_docs,
        supplemental_profile=supplemental,
    )

    # 2. Load enhanced schemes
    schemes_pool = _load_enhanced_schemes()
    if target_scheme_ids:
        clean_target_ids = {str(x).strip().lower() for x in target_scheme_ids}
        schemes_pool = [s for s in schemes_pool if s.get("scheme_id", "").lower() in clean_target_ids]

    schemes_meta_by_id = {s.get("scheme_id", ""): s for s in schemes_pool}

    # 3. Evaluate each scheme
    evaluations: List[Dict[str, Any]] = []
    for scheme_def in schemes_pool:
        eval_res = SchemeEvaluator.evaluate_scheme(scheme_def, unified_profile)
        evaluations.append(eval_res)

    # 4. Rank evaluations
    ranked = rank_schemes(evaluations, schemes_meta_by_id) if rank_schemes else evaluations

    return {
        "success": True,
        "applicant_profile": unified_profile.to_dict(),
        "evaluations": ranked,
    }

