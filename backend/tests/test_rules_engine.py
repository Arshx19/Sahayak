"""Unit tests for Unified Profile Merger, Locality Engine, and Deterministic Rules Evaluator."""

from datetime import date
import pytest
from backend.AI.rules_engine.profile_merger import merge_extracted_documents
from backend.AI.rules_engine.locality import evaluate_locality, evaluate_caste_category_locality
from backend.AI.rules_engine.evaluator import SchemeEvaluator, evaluate_condition_operator
from backend.AI.rules_engine.ranker import rank_schemes


def test_cross_document_fuzzy_name_and_dob_consistency():
    """Verify fuzzy name consistency and conflict detection."""
    # 1. Matching variant names should pass without conflict
    matching_docs = [
        {
            "doc_type": "aadhaar",
            "fields": {"name": {"value": "Rameshwar Patil", "confidence": 0.95}},
        },
        {
            "doc_type": "pan",
            "fields": {"name": {"value": "Rameshwar S Patil", "confidence": 0.95}},
        },
    ]
    p1 = merge_extracted_documents(matching_docs)
    assert len(p1.cross_doc_conflicts) == 0
    assert p1.name == "Rameshwar Patil"

    # 2. Conflicting names should be flagged
    conflicting_docs = [
        {
            "doc_type": "aadhaar",
            "fields": {
                "name": {"value": "Rameshwar Patil", "confidence": 0.95},
                "dob": {"value": "1992-05-15", "confidence": 0.95},
            },
        },
        {
            "doc_type": "pan",
            "fields": {
                "name": {"value": "Sunil Kumar Verma", "confidence": 0.95},
                "dob": {"value": "1988-10-20", "confidence": 0.95},
            },
        },
    ]
    p2 = merge_extracted_documents(conflicting_docs)
    assert len(p2.cross_doc_conflicts) >= 2
    assert any(c["conflict_type"] == "name_mismatch" for c in p2.cross_doc_conflicts)
    assert any(c["conflict_type"] == "dob_mismatch" for c in p2.cross_doc_conflicts)
    assert "name" in p2.unverified_fields
    assert "dob" in p2.unverified_fields


def test_expired_income_certificate_rejection():
    """Ensure expired income certificate is ignored and active one is selected."""
    docs = [
        {
            "doc_type": "income_certificate",
            "fields": {
                "annual_income": {"value": 120000, "confidence": 0.95},
                "issue_date": {"value": "2020-01-01", "confidence": 0.95},  # Expired (>3 years from 2026)
            },
        },
        {
            "doc_type": "income_certificate",
            "fields": {
                "annual_income": {"value": 180000, "confidence": 0.95},
                "issue_date": {"value": "2025-06-01", "confidence": 0.95},  # Active
            },
        },
    ]
    ref_date = date(2026, 10, 8)
    profile = merge_extracted_documents(docs, ref_date=ref_date)

    # Must select 180,000 from 2025 and ignore 120,000 from 2020
    assert profile.annual_family_income == 180000
    assert len(profile.warnings) > 0
    assert "expired" in profile.warnings[0].lower()


def test_edge_case_income_at_limit():
    """Test boundary condition: income exactly at limit vs limit + 1."""
    scheme = {
        "scheme_id": "SCH_TEST_INCOME",
        "level": "central",
        "applicable_states": ["ALL"],
        "eligibility_conditions": [
            {
                "field": "annual_family_income",
                "operator": "<=",
                "value": 250000,
                "description": "Income must not exceed Rs 2.5L",
            }
        ],
    }

    # Case A: Exactly at limit (250,000) -> MUST PASS
    docs_a = [{
        "doc_type": "income_certificate",
        "fields": {
            "annual_income": {"value": 250000, "confidence": 0.95},
            "issue_date": {"value": "2025-01-01", "confidence": 0.95},
        },
    }]
    prof_a = merge_extracted_documents(docs_a)
    eval_a = SchemeEvaluator.evaluate_scheme(scheme, prof_a)
    assert eval_a["status"] == "eligible"
    assert len(eval_a["passed"]) >= 1

    # Case B: Exceeds limit by 1 (250,001) -> MUST FAIL
    docs_b = [{
        "doc_type": "income_certificate",
        "fields": {
            "annual_income": {"value": 250001, "confidence": 0.95},
            "issue_date": {"value": "2025-01-01", "confidence": 0.95},
        },
    }]
    prof_b = merge_extracted_documents(docs_b)
    eval_b = SchemeEvaluator.evaluate_scheme(scheme, prof_b)
    assert eval_b["status"] == "not_eligible"
    assert len(eval_b["failed"]) >= 1
    assert "exceeds" in eval_b["failed"][0]["reason"].lower()


def test_edge_case_age_cutoff():
    """Test boundary condition: age exactly at cutoff vs cutoff + 1."""
    scheme = {
        "scheme_id": "SCH_TEST_AGE",
        "level": "central",
        "applicable_states": ["ALL"],
        "eligibility_conditions": [
            {
                "field": "age",
                "operator": "between",
                "value": [18, 30],
                "description": "Age between 18 and 30",
            }
        ],
    }

    # Exactly 30 years old -> PASS
    ref_date = date(2026, 10, 8)
    prof_at_limit = merge_extracted_documents(
        [{"doc_type": "aadhaar", "fields": {"dob": {"value": "1996-10-08", "confidence": 0.95}}}],
        ref_date=ref_date,
    )
    assert prof_at_limit.age == 30
    eval_30 = SchemeEvaluator.evaluate_scheme(scheme, prof_at_limit)
    assert eval_30["status"] == "eligible"

    # 31 years old -> FAIL
    prof_over_limit = merge_extracted_documents(
        [{"doc_type": "aadhaar", "fields": {"dob": {"value": "1995-10-08", "confidence": 0.95}}}],
        ref_date=ref_date,
    )
    assert prof_over_limit.age == 31
    eval_31 = SchemeEvaluator.evaluate_scheme(scheme, prof_over_limit)
    assert eval_31["status"] == "not_eligible"
    assert "outside eligible bracket" in eval_31["failed"][0]["reason"].lower()


def test_state_specific_caste_mismatch():
    """Verify state-specific category list verification across jurisdictions."""
    scheme = {
        "scheme_id": "SCH_MAHA_OBC",
        "level": "state",
        "applicable_states": ["Maharashtra"],
        "eligibility_conditions": [
            {
                "field": "caste_category",
                "operator": "in",
                "value": ["OBC"],
                "state_specific_caste_check": True,
                "description": "Must be OBC recognized by Maharashtra",
            }
        ],
    }

    # Case A: Caste certificate issued by Bihar applying for Maharashtra state scheme -> FAIL
    docs_mismatch = [
        {"doc_type": "domicile_certificate", "fields": {"state": {"value": "Maharashtra", "confidence": 0.95}}},
        {"doc_type": "caste_certificate", "fields": {
            "category": {"value": "OBC", "confidence": 0.95},
            "state_of_issue": {"value": "Bihar", "confidence": 0.95},
        }},
    ]
    prof_mismatch = merge_extracted_documents(docs_mismatch)
    eval_mismatch = SchemeEvaluator.evaluate_scheme(scheme, prof_mismatch)
    assert eval_mismatch["status"] == "not_eligible"
    assert "issued by maharashtra" in eval_mismatch["failed"][0]["reason"].lower()

    # Case B: Caste certificate issued by Maharashtra -> PASS
    docs_match = [
        {"doc_type": "domicile_certificate", "fields": {"state": {"value": "Maharashtra", "confidence": 0.95}}},
        {"doc_type": "caste_certificate", "fields": {
            "category": {"value": "OBC", "confidence": 0.95},
            "state_of_issue": {"value": "Maharashtra", "confidence": 0.95},
        }},
    ]
    prof_match = merge_extracted_documents(docs_match)
    eval_match = SchemeEvaluator.evaluate_scheme(scheme, prof_match)
    assert eval_match["status"] == "eligible"


def test_missing_or_unverified_field_triggers_needs_info():
    """Verify that unverified fields produce 'needs_info', NEVER silent pass or fail."""
    scheme = {
        "scheme_id": "SCH_TEST_CONFIRMATION",
        "level": "central",
        "applicable_states": ["ALL"],
        "required_documents": ["aadhaar", "marksheet"],
        "eligibility_conditions": [
            {
                "field": "marks_percentage",
                "operator": ">=",
                "value": 75.0,
                "description": "Minimum 75% marks",
            }
        ],
    }

    # User uploaded Aadhaar, but marksheet is missing
    docs = [{"doc_type": "aadhaar", "fields": {"dob": {"value": "2000-01-01", "confidence": 0.95}}}]
    prof = merge_extracted_documents(docs)
    res = SchemeEvaluator.evaluate_scheme(scheme, prof)

    # Must be needs_info, NOT eligible or not_eligible
    assert res["status"] == "needs_info"
    assert "marksheet" in res["missing_documents"]
    assert len(res["unverified"]) >= 1
    assert res["unverified"][0]["missing"] == "marks_percentage"


def test_direct_exclusion_handling():
    """Verify direct exclusion criteria (e.g. income tax payer) rejects applicant."""
    scheme = {
        "scheme_id": "SCH_FARMER_TEST",
        "level": "central",
        "applicable_states": ["ALL"],
        "eligibility_conditions": [
            {"field": "occupation", "operator": "==", "value": "farmer", "description": "Farmer"}
        ],
        "exclusions": [
            {
                "field": "is_income_tax_payer",
                "operator": "==",
                "value": True,
                "reason": "Income tax payers are barred from benefit",
            }
        ],
    }

    prof = merge_extracted_documents([], supplemental_profile={
        "occupation": "farmer",
        "is_income_tax_payer": True,
    })
    res = SchemeEvaluator.evaluate_scheme(scheme, prof)
    assert res["status"] == "not_eligible"
    assert any("income tax" in f["reason"].lower() for f in res["failed"])


def test_scheme_ranking_order():
    """Verify ranking order by status (eligible > needs_info > not_eligible) and benefit value."""
    evals = [
        {"scheme_id": "S1", "status": "not_eligible", "passed": [], "missing_documents": []},
        {"scheme_id": "S2", "status": "needs_info", "passed": [{"c": "c1"}], "missing_documents": ["d1"]},
        {"scheme_id": "S3", "status": "eligible", "passed": [{"c": "c1"}, {"c": "c2"}], "missing_documents": []},
        {"scheme_id": "S4", "status": "eligible", "passed": [{"c": "c1"}], "missing_documents": []},
    ]
    meta = {
        "S1": {"benefit_summary": {"amount_inr": 10000}},
        "S2": {"benefit_summary": {"amount_inr": 50000}},
        "S3": {"benefit_summary": {"amount_inr": 50000}},
        "S4": {"benefit_summary": {"amount_inr": 500000}},
    }
    ranked = rank_schemes(evals, meta)
    # Highest ranked should be eligible schemes
    assert ranked[0]["status"] == "eligible"
    assert ranked[1]["status"] == "eligible"
    # S4 has 500,000 INR benefit, so it ranks before S3 (50,000)
    assert ranked[0]["scheme_id"] == "S4"
    assert ranked[1]["scheme_id"] == "S3"
    assert ranked[2]["scheme_id"] == "S2"
    assert ranked[3]["scheme_id"] == "S1"

