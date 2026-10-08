"""Scheme Ranking and Prioritization Engine.

Ranks evaluated welfare schemes:
1. Eligibility status: 'eligible' > 'needs_info' > 'not_eligible'
2. Monetary / benefit value (Direct Benefit Transfer amount or coverage in INR)
3. Number of matched criteria (criteria match score)
4. Minimal missing documents
"""

from typing import Any, Dict, List


def get_scheme_benefit_value(scheme: Dict[str, Any]) -> float:
    """Extract numeric benefit amount from scheme metadata for ranking."""
    benefit_sum = scheme.get("benefit_summary")
    if isinstance(benefit_sum, dict):
        amt = benefit_sum.get("amount_inr")
        if amt is not None:
            try:
                return float(amt)
            except (ValueError, TypeError):
                pass
    # Fallback checking benefits string for numbers
    raw_benefits = str(scheme.get("benefits", ""))
    if "5 lakh" in raw_benefits.lower() or "5,00,000" in raw_benefits:
        return 500000.0
    if "50,000" in raw_benefits:
        return 50000.0
    if "6,000" in raw_benefits or "6000" in raw_benefits:
        return 6000.0
    return 1000.0


def rank_schemes(
    evaluations: List[Dict[str, Any]],
    schemes_metadata_by_id: Dict[str, Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Ranks a list of evaluation outputs by status, benefit amount, and matched conditions.
    """
    status_weights = {
        "eligible": 3,
        "needs_info": 2,
        "not_eligible": 1,
    }

    def sort_key(eval_res: Dict[str, Any]) -> tuple:
        s_id = eval_res.get("scheme_id", "")
        status = eval_res.get("status", "not_eligible")
        status_rank = status_weights.get(status, 0)

        # Matched count
        passed_count = len(eval_res.get("passed", []))
        # Missing docs penalty
        missing_count = len(eval_res.get("missing_documents", []))

        # Benefit amount
        scheme_meta = schemes_metadata_by_id.get(s_id, {})
        benefit_val = get_scheme_benefit_value(scheme_meta)

        return (
            status_rank,
            benefit_val,
            passed_count,
            -missing_count,
        )

    sorted_evaluations = sorted(evaluations, key=sort_key, reverse=True)
    return sorted_evaluations
