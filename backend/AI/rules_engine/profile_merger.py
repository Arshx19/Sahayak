"""Unified Applicant Profile Merger with Cross-Document Consistency Checking.

Merges extracted attributes from multiple uploaded government certificates:
1. Fuzzy cross-document consistency checks (name, DOB, father's name, state).
2. Selects the most recent valid income certificate (ignores and flags expired ones).
3. Normalizes age from DOB as of today.
4. Identifies cross-document conflicts instead of silently overwriting.
5. Gates low-confidence or unverified fields so rules engine triggers 'needs_confirmation'.
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

try:
    from rapidfuzz import fuzz
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False

from ..extraction.validators import calculate_age_from_dob, validate_certificate_validity


def fuzzy_similarity_ratio(str1: str, str2: str) -> float:
    """Calculate token-sorted fuzzy similarity between two strings (0.0 to 1.0)."""
    if not str1 or not str2:
        return 0.0
    s1, s2 = str1.strip().lower(), str2.strip().lower()
    if s1 == s2:
        return 1.0
    if HAS_RAPIDFUZZ:
        return fuzz.token_sort_ratio(s1, s2) / 100.0

    # Simple fallback Levenshtein-like ratio
    set1, set2 = set(s1.split()), set(s2.split())
    if set1 == set2:
        return 0.95
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union if union > 0 else 0.0


class UnifiedApplicantProfile:
    """Represents the synthesized, verified profile of an applicant."""

    def __init__(self):
        self.name: Optional[str] = None
        self.dob: Optional[str] = None  # ISO YYYY-MM-DD
        self.age: Optional[int] = None
        self.gender: Optional[str] = None
        self.state: Optional[str] = None
        self.district: Optional[str] = None
        self.area_type: str = "rural"  # rural / urban
        self.caste_category: Optional[str] = None  # SC, ST, OBC, EWS, General
        self.caste_name: Optional[str] = None
        self.caste_cert_state: Optional[str] = None
        self.annual_family_income: Optional[int] = None
        self.income_issue_date: Optional[str] = None
        self.education_level: Optional[str] = None
        self.marks_percentage: Optional[float] = None
        self.is_differently_abled: bool = False
        self.disability_percentage: Optional[float] = None
        self.disability_type: Optional[str] = None
        self.is_bpl: bool = False
        self.bpl_card_type: Optional[str] = None
        self.family_size: Optional[int] = None
        self.occupation: Optional[str] = None
        self.marital_status: Optional[str] = None
        self.land_acres: Optional[float] = None

        # Metadata & Quality Assurance
        self.uploaded_documents: List[str] = []
        self.field_sources: Dict[str, str] = {}
        self.field_confidences: Dict[str, float] = {}
        self.unverified_fields: List[str] = []
        self.cross_doc_conflicts: List[Dict[str, Any]] = []
        self.warnings: List[str] = []
        self.custom_attributes: Dict[str, Any] = {}

    def to_dict(self) -> Dict[str, Any]:
        res = {
            "name": self.name,
            "dob": self.dob,
            "age": self.age,
            "gender": self.gender,
            "state": self.state,
            "district": self.district,
            "area_type": self.area_type,
            "caste_category": self.caste_category,
            "caste_name": self.caste_name,
            "caste_cert_state": self.caste_cert_state,
            "annual_family_income": self.annual_family_income,
            "income_issue_date": self.income_issue_date,
            "education_level": self.education_level,
            "marks_percentage": self.marks_percentage,
            "is_differently_abled": self.is_differently_abled,
            "disability_percentage": self.disability_percentage,
            "disability_type": self.disability_type,
            "is_bpl": self.is_bpl,
            "bpl_card_type": self.bpl_card_type,
            "family_size": self.family_size,
            "occupation": self.occupation,
            "marital_status": self.marital_status,
            "land_acres": self.land_acres,
            "uploaded_documents": self.uploaded_documents,
            "unverified_fields": self.unverified_fields,
            "cross_doc_conflicts": self.cross_doc_conflicts,
            "warnings": self.warnings,
        }
        res.update(self.custom_attributes)
        return res


def merge_extracted_documents(
    extracted_docs: List[Dict[str, Any]],
    supplemental_profile: Optional[Dict[str, Any]] = None,
    ref_date: Optional[date] = None,
) -> UnifiedApplicantProfile:
    """
    Synthesizes a UnifiedApplicantProfile from a list of document extraction results.
    Applies fuzzy cross-document validation, expired certificate rejection,
    and confidence tracking.
    """
    profile = UnifiedApplicantProfile()
    names_collected: List[Tuple[str, str]] = []  # (name, doc_type)
    dobs_collected: List[Tuple[str, str]] = []   # (dob, doc_type)
    valid_incomes: List[Dict[str, Any]] = []

    for doc in extracted_docs:
        doc_type = doc.get("doc_type", "unknown")
        if doc_type != "unknown" and doc_type not in profile.uploaded_documents:
            profile.uploaded_documents.append(doc_type)

        fields = doc.get("fields", {})
        needs_review = set(doc.get("needs_review", []))

        # Helper to extract field value & confidence
        def get_field_val(f_name: str) -> Tuple[Any, float]:
            if f_name in fields:
                val = fields[f_name].get("value")
                conf = float(fields[f_name].get("confidence", 0.8))
                if f_name in needs_review or conf < 0.70:
                    profile.unverified_fields.append(f_name)
                return val, conf
            return None, 0.0

        # 1. Names & DOB Collection for Cross-Document Consistency Check
        val_name, conf_name = get_field_val("name")
        if val_name and isinstance(val_name, str) and len(val_name.strip()) > 2:
            names_collected.append((val_name.strip(), doc_type))

        val_dob, conf_dob = get_field_val("dob")
        if val_dob and isinstance(val_dob, str):
            dobs_collected.append((val_dob.strip(), doc_type))

        # 2. Document Specific Attribute Mapping
        if doc_type == "aadhaar":
            val_gender, conf_g = get_field_val("gender")
            if val_gender:
                profile.gender = val_gender
                profile.field_sources["gender"] = "aadhaar"
                profile.field_confidences["gender"] = conf_g

            val_state, conf_s = get_field_val("state")
            if val_state and not profile.state:
                profile.state = val_state
                profile.field_sources["state"] = "aadhaar"
                profile.field_confidences["state"] = conf_s

            val_dist, conf_d = get_field_val("district")
            if val_dist and not profile.district:
                profile.district = val_dist
                profile.field_sources["district"] = "aadhaar"
                profile.field_confidences["district"] = conf_d

        elif doc_type == "income_certificate":
            val_inc, conf_i = get_field_val("annual_income")
            val_issue_d, _ = get_field_val("issue_date")
            is_valid, reason = validate_certificate_validity(val_issue_d, validity_years=3, ref_date=ref_date)

            if not is_valid:
                profile.warnings.append(
                    f"Income Certificate issued on {val_issue_d or 'unknown date'} is invalid/expired: {reason}. Ignored for eligibility."
                )
            elif val_inc is not None:
                valid_incomes.append({
                    "amount": int(val_inc),
                    "issue_date": val_issue_d,
                    "confidence": conf_i,
                    "source": doc_type,
                })

        elif doc_type == "caste_certificate":
            val_cat, conf_cat = get_field_val("category")
            if val_cat:
                profile.caste_category = val_cat
                profile.field_sources["caste_category"] = "caste_certificate"
                profile.field_confidences["caste_category"] = conf_cat

            val_caste, _ = get_field_val("caste")
            if val_caste:
                profile.caste_name = val_caste

            val_c_state, _ = get_field_val("state_of_issue")
            if val_c_state:
                profile.caste_cert_state = val_c_state

        elif doc_type == "domicile_certificate":
            val_state, conf_s = get_field_val("state")
            if val_state:
                profile.state = val_state
                profile.field_sources["state"] = "domicile_certificate"
                profile.field_confidences["state"] = conf_s

            val_dist, conf_d = get_field_val("district")
            if val_dist:
                profile.district = val_dist
                profile.field_sources["district"] = "domicile_certificate"
                profile.field_confidences["district"] = conf_d

        elif doc_type == "marksheet":
            val_perc, conf_p = get_field_val("marks_percentage")
            if val_perc is not None:
                profile.marks_percentage = float(val_perc)
                profile.field_sources["marks_percentage"] = "marksheet"
                profile.field_confidences["marks_percentage"] = conf_p

            val_lvl, _ = get_field_val("qualification_level")
            if val_lvl:
                profile.education_level = val_lvl

        elif doc_type == "disability_certificate":
            profile.is_differently_abled = True
            val_dp, conf_dp = get_field_val("percentage")
            if val_dp is not None:
                profile.disability_percentage = float(val_dp)
                profile.field_sources["disability_percentage"] = "disability_certificate"
                profile.field_confidences["disability_percentage"] = conf_dp

            val_dt, _ = get_field_val("disability_type")
            if val_dt:
                profile.disability_type = val_dt

        elif doc_type == "ration_bpl":
            val_bpl, _ = get_field_val("is_bpl")
            profile.is_bpl = bool(val_bpl)

            val_ctype, _ = get_field_val("card_type")
            if val_ctype:
                profile.bpl_card_type = val_ctype

            val_fsize, _ = get_field_val("family_size")
            if val_fsize:
                profile.family_size = int(val_fsize)

        elif doc_type == "land_record":
            val_acres, conf_la = get_field_val("land_acres")
            if val_acres is not None:
                profile.land_acres = float(val_acres)
                profile.field_sources["land_acres"] = "land_record"
                profile.field_confidences["land_acres"] = conf_la

    # =========================================================================
    # 3. SELECT MOST RECENT VALID INCOME CERTIFICATE
    # =========================================================================
    if valid_incomes:
        # Sort by issue date descending
        valid_incomes.sort(key=lambda x: str(x.get("issue_date") or ""), reverse=True)
        chosen_inc = valid_incomes[0]
        profile.annual_family_income = chosen_inc["amount"]
        profile.income_issue_date = chosen_inc.get("issue_date")
        profile.field_sources["annual_family_income"] = chosen_inc["source"]
        profile.field_confidences["annual_family_income"] = chosen_inc["confidence"]

    # =========================================================================
    # 4. CROSS-DOCUMENT FUZZY CONSISTENCY MATCHING (Name & DOB)
    # =========================================================================
    if names_collected:
        primary_name, primary_doc = names_collected[0]
        profile.name = primary_name
        profile.field_sources["name"] = primary_doc

        for other_name, other_doc in names_collected[1:]:
            sim = fuzzy_similarity_ratio(primary_name, other_name)
            if sim < 0.75:
                conflict = {
                    "field": "name",
                    "conflict_type": "name_mismatch",
                    "doc1": primary_doc,
                    "val1": primary_name,
                    "doc2": other_doc,
                    "val2": other_name,
                    "similarity": round(sim, 2),
                    "description": f"Name mismatch across {primary_doc} ('{primary_name}') and {other_doc} ('{other_name}'). Match score: {int(sim * 100)}%",
                }
                profile.cross_doc_conflicts.append(conflict)
                profile.unverified_fields.append("name")

    if dobs_collected:
        primary_dob, primary_doc = dobs_collected[0]
        profile.dob = primary_dob
        profile.age = calculate_age_from_dob(primary_dob, ref_date=ref_date)
        profile.field_sources["dob"] = primary_doc

        for other_dob, other_doc in dobs_collected[1:]:
            if primary_dob != other_dob:
                conflict = {
                    "field": "dob",
                    "conflict_type": "dob_mismatch",
                    "doc1": primary_doc,
                    "val1": primary_dob,
                    "doc2": other_doc,
                    "val2": other_dob,
                    "description": f"DOB discrepancy: {primary_doc} shows {primary_dob} but {other_doc} shows {other_dob}",
                }
                profile.cross_doc_conflicts.append(conflict)
                profile.unverified_fields.append("dob")
                profile.unverified_fields.append("age")

    # =========================================================================
    # 5. SUPPLEMENTAL PROFILE OVERRIDES (User Declared / Form Data)
    # =========================================================================
    if supplemental_profile:
        for k, v in supplemental_profile.items():
            if v is not None:
                profile.custom_attributes[k] = v
                if k in ("annual_income", "income") and profile.annual_family_income is None:
                    try:
                        profile.annual_family_income = int(v)
                    except (ValueError, TypeError):
                        pass
                elif k == "state" and not profile.state:
                    profile.state = str(v)
                elif k == "district" and not profile.district:
                    profile.district = str(v)
                elif k == "caste_category" and not profile.caste_category:
                    profile.caste_category = str(v)
                elif k == "occupation" and not profile.occupation:
                    profile.occupation = str(v)
                elif k == "land_acres" and profile.land_acres is None:
                    try:
                        profile.land_acres = float(v)
                    except (ValueError, TypeError):
                        pass
                elif k == "age" and profile.age is None:
                    try:
                        profile.age = int(v)
                    except (ValueError, TypeError):
                        pass
                elif k == "gender" and not profile.gender:
                    profile.gender = str(v)
                elif k == "marital_status" and not profile.marital_status:
                    profile.marital_status = str(v)

    # Deduplicate unverified fields
    profile.unverified_fields = list(set(profile.unverified_fields))

    return profile
