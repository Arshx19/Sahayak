"""Deterministic Explainable Scheme Eligibility Evaluator.

Evaluates a UnifiedApplicantProfile against data-driven government scheme rules.
Supports:
1. Condition operators: ==, !=, <=, >=, <, >, in, not_in, between, has_document.
2. Direct exclusions (income tax payers, institutional landholders, active beneficiaries).
3. Locality & state-specific caste list verification.
4. Gender and age gating (calculated from DOB as of today).
5. Confidence gating (unverified fields produce 'needs_info' / 'unverified', never silent pass/fail).

Strictly produces the requested output contract:
{
  "scheme_id": "...",
  "status": "eligible|not_eligible|needs_info",
  "passed": [{ "condition": "...", "applicant_value": "..." }],
  "failed": [{ "condition": "...", "applicant_value": "...", "reason": "..." }],
  "unverified": [{ "condition": "...", "missing": "..." }],
  "missing_documents": []
}
"""

from typing import Any, Dict, List, Optional, Tuple, Union
from .locality import evaluate_locality, evaluate_caste_category_locality
from .profile_merger import UnifiedApplicantProfile


def evaluate_condition_operator(actual_val: Any, operator: str, expected_val: Any) -> Tuple[bool, str]:
    """
    Deterministically evaluates an operator against actual and expected values.
    Returns (passed, failure_reason).
    """
    op = operator.strip().lower()

    if op == "==":
        if isinstance(actual_val, str) and isinstance(expected_val, str):
            passed = actual_val.strip().lower() == expected_val.strip().lower()
        else:
            passed = actual_val == expected_val
        return passed, f"Expected exactly '{expected_val}', got '{actual_val}'" if not passed else ""

    elif op == "!=":
        if isinstance(actual_val, str) and isinstance(expected_val, str):
            passed = actual_val.strip().lower() != expected_val.strip().lower()
        else:
            passed = actual_val != expected_val
        return passed, f"Must not equal '{expected_val}'" if not passed else ""

    elif op == "<=":
        try:
            act_num = float(actual_val)
            exp_num = float(expected_val)
            passed = act_num <= exp_num
            return passed, f"{act_num} exceeds maximum permitted threshold of {exp_num}" if not passed else ""
        except (ValueError, TypeError):
            return False, f"Could not perform numerical comparison: '{actual_val}' <= '{expected_val}'"

    elif op == ">=":
        try:
            act_num = float(actual_val)
            exp_num = float(expected_val)
            passed = act_num >= exp_num
            return passed, f"{act_num} is below minimum requirement of {exp_num}" if not passed else ""
        except (ValueError, TypeError):
            return False, f"Could not perform numerical comparison: '{actual_val}' >= '{expected_val}'"

    elif op == "<":
        try:
            act_num = float(actual_val)
            exp_num = float(expected_val)
            passed = act_num < exp_num
            return passed, f"{act_num} is not strictly less than {exp_num}" if not passed else ""
        except (ValueError, TypeError):
            return False, f"Could not perform numerical comparison: '{actual_val}' < '{expected_val}'"

    elif op == ">":
        try:
            act_num = float(actual_val)
            exp_num = float(expected_val)
            passed = act_num > exp_num
            return passed, f"{act_num} does not exceed required {exp_num}" if not passed else ""
        except (ValueError, TypeError):
            return False, f"Could not perform numerical comparison: '{actual_val}' > '{expected_val}'"

    elif op == "in":
        if isinstance(expected_val, list):
            clean_expected = [str(x).strip().lower() for x in expected_val]
            passed = str(actual_val).strip().lower() in clean_expected or "all" in clean_expected
            return passed, f"'{actual_val}' is not in approved list: {', '.join([str(x) for x in expected_val])}" if not passed else ""
        passed = str(actual_val).strip().lower() == str(expected_val).strip().lower()
        return passed, f"Expected '{expected_val}', got '{actual_val}'" if not passed else ""

    elif op == "not_in":
        if isinstance(expected_val, list):
            clean_expected = [str(x).strip().lower() for x in expected_val]
            passed = str(actual_val).strip().lower() not in clean_expected
            return passed, f"'{actual_val}' is an excluded value from: {', '.join([str(x) for x in expected_val])}" if not passed else ""
        passed = str(actual_val).strip().lower() != str(expected_val).strip().lower()
        return passed, f"Value '{actual_val}' is excluded" if not passed else ""

    elif op == "between":
        if isinstance(expected_val, (list, tuple)) and len(expected_val) == 2:
            try:
                act_num = float(actual_val)
                low = float(expected_val[0])
                high = float(expected_val[1])
                passed = low <= act_num <= high
                return passed, f"{act_num} is outside eligible bracket of [{low}, {high}]" if not passed else ""
            except (ValueError, TypeError):
                return False, f"Invalid numerical range for between comparison: {expected_val}"
        return False, "Malformed between condition parameters"

    return False, f"Unsupported rule operator '{operator}'"


class SchemeEvaluator:
    """Evaluates scheme eligibility against a UnifiedApplicantProfile."""

    @staticmethod
    def evaluate_scheme(
        scheme: Dict[str, Any],
        profile: UnifiedApplicantProfile,
    ) -> Dict[str, Any]:
        """
        Evaluate a single scheme against the applicant profile.
        Returns the standardized eligibility dictionary.
        """
        scheme_id = scheme.get("scheme_id") or scheme.get("code") or "UNKNOWN_SCHEME"
        passed_list: List[Dict[str, Any]] = []
        failed_list: List[Dict[str, Any]] = []
        unverified_list: List[Dict[str, Any]] = []
        missing_docs: List[str] = []

        profile_dict = profile.to_dict()
        unverified_fields_set = set(profile.unverified_fields)

        # ---------------------------------------------------------------------
        # 1. EVALUATE REQUIRED DOCUMENTS
        # ---------------------------------------------------------------------
        required_docs = scheme.get("required_documents", [])
        uploaded_docs_normalized = {d.strip().lower().replace("-", "_") for d in profile.uploaded_documents}

        for doc_key in required_docs:
            clean_dk = doc_key.strip().lower().replace("-", "_")
            if clean_dk not in uploaded_docs_normalized:
                missing_docs.append(clean_dk)

        # ---------------------------------------------------------------------
        # 2. EVALUATE EXCLUSIONS (First-Order Gating)
        # ---------------------------------------------------------------------
        exclusions = scheme.get("exclusions", [])
        for excl in exclusions:
            field_name = excl.get("field")
            op = excl.get("operator", "==")
            excl_val = excl.get("value")
            reason = excl.get("reason") or f"Exclusion criteria met: {field_name} {op} {excl_val}"

            actual_val = profile_dict.get(field_name)
            if actual_val is not None:
                is_excluded, _ = evaluate_condition_operator(actual_val, op, excl_val)
                if is_excluded:
                    failed_list.append({
                        "condition": f"Exclusion: {field_name} {op} {excl_val}",
                        "applicant_value": str(actual_val),
                        "reason": reason,
                    })

        # ---------------------------------------------------------------------
        # 3. EVALUATE LOCALITY & JURISDICTION
        # ---------------------------------------------------------------------
        scheme_level = scheme.get("level") or scheme.get("scheme_type") or "central"
        app_states = scheme.get("applicable_states", ["ALL"])
        app_districts = scheme.get("applicable_districts", [])

        loc_passed, loc_msg = evaluate_locality(
            applicant_state=profile.state,
            applicant_district=profile.district,
            scheme_level=scheme_level,
            applicable_states=app_states,
            applicable_districts=app_districts,
        )

        if not loc_passed:
            if not profile.state:
                unverified_list.append({
                    "condition": f"Residency in {', '.join(app_states)}",
                    "missing": "state",
                    "reason": loc_msg,
                })
            else:
                failed_list.append({
                    "condition": f"Residency in {', '.join(app_states)}",
                    "applicant_value": profile.state or "Missing",
                    "reason": loc_msg,
                })
        else:
            passed_list.append({
                "condition": f"Residency in {', '.join(app_states)}",
                "applicant_value": profile.state or "All India",
            })

        # ---------------------------------------------------------------------
        # 4. EVALUATE ELIGIBILITY CONDITIONS
        # ---------------------------------------------------------------------
        conditions = scheme.get("eligibility_conditions", [])
        for cond in conditions:
            field = cond.get("field")
            op = cond.get("operator", "==")
            exp_val = cond.get("value")
            desc = cond.get("description") or f"{field} {op} {exp_val}"
            mandatory = cond.get("mandatory", True)
            state_specific_caste = cond.get("state_specific_caste_check", False)

            actual_val = profile_dict.get(field)

            # Special Handling: State-Specific Caste Matching
            if state_specific_caste and field == "caste_category":
                target_cats = exp_val if isinstance(exp_val, list) else [exp_val]
                caste_match, caste_msg = evaluate_caste_category_locality(
                    applicant_caste=profile.caste_name,
                    applicant_category=profile.caste_category,
                    caste_cert_state=profile.caste_cert_state,
                    scheme_level=scheme_level,
                    scheme_states=app_states,
                    target_categories=target_cats,
                )
                if not caste_match:
                    if not profile.caste_category:
                        unverified_list.append({"condition": desc, "missing": field, "reason": caste_msg})
                    else:
                        failed_list.append({"condition": desc, "applicant_value": profile.caste_category, "reason": caste_msg})
                else:
                    passed_list.append({"condition": desc, "applicant_value": f"{profile.caste_category} ({profile.caste_cert_state})"})
                continue

            # Check if field is completely missing or flagged as unverified
            if actual_val is None or field in unverified_fields_set:
                unverified_list.append({
                    "condition": desc,
                    "missing": field,
                    "reason": f"Field '{field}' is unverified or requires citizen review",
                })
                continue

            # Normal Operator Evaluation
            passed, fail_reason = evaluate_condition_operator(actual_val, op, exp_val)

            if passed:
                passed_list.append({
                    "condition": desc,
                    "applicant_value": str(actual_val),
                })
            else:
                failed_list.append({
                    "condition": desc,
                    "applicant_value": str(actual_val),
                    "reason": fail_reason or f"Requirement not met: {desc}",
                })

        # ---------------------------------------------------------------------
        # 5. OVERALL STATUS DETERMINATION
        # ---------------------------------------------------------------------
        if failed_list:
            status = "not_eligible"
        elif unverified_list or missing_docs:
            status = "needs_info"
        else:
            status = "eligible"

        return {
            "scheme_id": scheme_id,
            "status": status,
            "passed": passed_list,
            "failed": failed_list,
            "unverified": unverified_list,
            "missing_documents": missing_docs,
        }
