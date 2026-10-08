"""Locality and State-Specific Jurisdictional Matching Engine.

Handles:
1. Central vs State Scheme geographic applicability.
2. District-level scheme constraints.
3. State-Specific Caste Category List Matching:
   - A caste/community may be recognized as OBC in State A (e.g. Jat in Rajasthan, Maratha in Maharashtra)
     but not in State B or under the Central list.
   - Matches applicant's category against the certificate issuing state and scheme state.
"""

from typing import Any, Dict, List, Optional, Tuple


# Known State-Specific Caste mappings for common demographic verification
STATE_CASTE_LISTS: Dict[str, Dict[str, str]] = {
    "Maharashtra": {
        "maratha": "OBC",
        "dhangar": "NT",
        "mali": "OBC",
        "mahar": "SC",
        "mang": "SC",
        "bhil": "ST",
        "gond": "ST",
    },
    "Uttar Pradesh": {
        "yadav": "OBC",
        "kurmi": "OBC",
        "maurya": "OBC",
        "chamar": "SC",
        "jatav": "SC",
        "pasi": "SC",
        "tharu": "ST",
    },
    "Rajasthan": {
        "jat": "OBC",
        "gurjar": "MBC",
        "meena": "ST",
        "bhil": "ST",
        "meghwal": "SC",
        "bairwa": "SC",
    },
    "Bihar": {
        "yadav": "OBC",
        "kurmi": "OBC",
        "kushwaha": "OBC",
        "mallah": "EBC",
        "paswan": "SC",
        "dusadh": "SC",
        "musahar": "SC",
        "santhal": "ST",
    },
    "Karnataka": {
        "lingayat": "OBC",
        "vokkaliga": "OBC",
        "kuruba": "OBC",
        "madiga": "SC",
        "holeya": "SC",
        "nayaka": "ST",
    },
}


def evaluate_locality(
    applicant_state: Optional[str],
    applicant_district: Optional[str],
    scheme_level: str,
    applicable_states: List[str],
    applicable_districts: Optional[List[str]] = None,
) -> Tuple[bool, str]:
    """
    Evaluate geographic locality criteria for Central or State welfare schemes.
    Returns (is_eligible, explanation).
    """
    clean_level = (scheme_level or "central").strip().lower()

    # Central schemes are universally applicable across India unless explicitly restricted
    if clean_level == "central":
        if not applicable_states or "ALL" in [s.upper() for s in applicable_states]:
            return True, "Central scheme applicable across all States and Union Territories"
        # Central scheme with specific state focus
        if applicant_state and any(applicant_state.lower() == s.lower() for s in applicable_states):
            return True, f"Applicable in your state ({applicant_state})"
        return False, f"Central scheme limited to: {', '.join(applicable_states)}"

    # State Schemes
    clean_app_states = [s.strip().lower() for s in applicable_states if s]
    if not applicant_state:
        return False, f"State scheme requires verified domicile in: {', '.join(applicable_states)}"

    if applicant_state.lower() not in clean_app_states:
        return False, (
            f"Scheme is restricted to domicile holders of {', '.join(applicable_states)}. "
            f"Your verified domicile is {applicant_state}."
        )

    # District Constraints (if specified)
    if applicable_districts and len(applicable_districts) > 0:
        clean_districts = [d.strip().lower() for d in applicable_districts]
        if not applicant_district:
            return False, f"Scheme requires residency in specific districts: {', '.join(applicable_districts)}"
        if applicant_district.lower() not in clean_districts:
            return False, (
                f"Scheme restricted to districts: {', '.join(applicable_districts)}. "
                f"Your district is {applicant_district}."
            )

    return True, f"Geographic eligibility verified for {applicant_state}"


def evaluate_caste_category_locality(
    applicant_caste: Optional[str],
    applicant_category: Optional[str],
    caste_cert_state: Optional[str],
    scheme_level: str,
    scheme_states: List[str],
    target_categories: List[str],
) -> Tuple[bool, str]:
    """
    Match applicant's caste category against state-specific category lists.
    Validates whether the caste category is recognized within the jurisdiction of the scheme.
    """
    clean_cat = (applicant_category or "").strip().upper()
    target_cats = [c.strip().upper() for c in target_categories]

    if not clean_cat:
        return False, "Caste category is missing or unverified"

    # General category applies everywhere without state reservation disputes
    if clean_cat == "GENERAL" and "GENERAL" in target_cats:
        return True, "General category match"

    # Check basic category membership first
    if clean_cat not in target_cats:
        return False, f"Category '{clean_cat}' does not match required categories ({', '.join(target_cats)})"

    # For state-level schemes, check if certificate was issued by the matching state
    clean_level = (scheme_level or "central").strip().lower()
    if clean_level == "state":
        scheme_state_clean = [s.strip().lower() for s in scheme_states if s and s.upper() != "ALL"]
        if caste_cert_state and scheme_state_clean:
            if caste_cert_state.lower() not in scheme_state_clean:
                return False, (
                    f"State-specific reservation requires caste certificate issued by {', '.join(scheme_states)}. "
                    f"Your certificate was issued by {caste_cert_state}."
                )

    # If specific caste name is provided, cross-check against state list
    if applicant_caste and caste_cert_state:
        state_list = STATE_CASTE_LISTS.get(caste_cert_state, {})
        caste_lower = applicant_caste.strip().lower()
        if caste_lower in state_list:
            official_state_cat = state_list[caste_lower]
            if official_state_cat.upper() in target_cats:
                return True, f"Caste '{applicant_caste}' recognized as {official_state_cat} in {caste_cert_state}"

    return True, f"Category '{clean_cat}' satisfies scheme requirement"
