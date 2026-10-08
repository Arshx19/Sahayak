"""Unit tests for Document Classification and Field Feature Extractors."""

import pytest
from backend.AI.extraction.classifier import classify_document_text
from backend.AI.extraction.extractors import (
    AadhaarExtractor,
    PANExtractor,
    IncomeCertificateExtractor,
    CasteCertificateExtractor,
    DomicileExtractor,
    MarksheetExtractor,
    DisabilityCertificateExtractor,
    RationBplExtractor,
)


def test_document_classification():
    """Test bilingual keyword anchor classification."""
    aadhaar_sample = "GOVERNMENT OF INDIA UIDAI मेरा आधार मेरी पहचान Enrollment No 1234"
    doc_type, conf, _ = classify_document_text(aadhaar_sample)
    assert doc_type == "aadhaar"
    assert conf > 0.70

    pan_sample = "INCOME TAX DEPARTMENT GOVT. OF INDIA Permanent Account Number ABCDE1234F"
    doc_type, conf, _ = classify_document_text(pan_sample)
    assert doc_type == "pan"

    income_sample = "कार्यालय तहसीलदार राजस्व विभाग आय प्रमाण पत्र Annual Income Rs. 150000"
    doc_type, conf, _ = classify_document_text(income_sample)
    assert doc_type == "income_certificate"

    caste_sample = "प्रमाणित किया जाता है कि जाति प्रमाण पत्र Other Backward Class OBC अनुप्रमाणित"
    doc_type, conf, _ = classify_document_text(caste_sample)
    assert doc_type == "caste_certificate"

    domicile_sample = "Government of Maharashtra Domicile Certificate Ordinarily Resident of Satara"
    doc_type, conf, _ = classify_document_text(domicile_sample)
    assert doc_type == "domicile_certificate"

    marksheet_sample = "Central Board of Secondary Education CBSE Statement of Marks Class 10 Roll No 451234 Total Marks 420/500"
    doc_type, conf, _ = classify_document_text(marksheet_sample)
    assert doc_type == "marksheet"

    disability_sample = "Unique Disability ID UDID Locomotor Disability Percentage of Disability 50%"
    doc_type, conf, _ = classify_document_text(disability_sample)
    assert doc_type == "disability_certificate"

    ration_sample = "Department of Food & Civil Supplies Antyodaya Anna Yojana AAY Ration Card Family Members 5"
    doc_type, conf, _ = classify_document_text(ration_sample)
    assert doc_type == "ration_bpl"


def test_aadhaar_extractor():
    """Test Aadhaar extraction, masking, and field parsing."""
    sample = """
    Government of India
    Rameshwar Patil
    DOB: 15/05/1992
    Male
    Address: Satara, Maharashtra - 415001
    9876 5432 1098
    """
    extractor = AadhaarExtractor()
    res = extractor.extract(sample).to_dict()

    assert res["doc_type"] == "aadhaar"
    assert res["fields"]["dob"]["value"] == "1992-05-15"
    assert res["fields"]["gender"]["value"] == "Male"
    assert res["fields"]["state"]["value"] == "Maharashtra"
    assert res["fields"]["pincode"]["value"] == "415001"
    # Aadhaar number must be strictly masked (only last 4)
    assert res["fields"]["aadhaar_last_4"]["value"] == "1098"
    assert "9876" not in str(res["fields"]["aadhaar_last_4"]["value"])


def test_pan_extractor():
    """Test PAN card regex extraction and structural validation."""
    sample = """
    INCOME TAX DEPARTMENT
    ABCPE1234F
    Name: SURESH KUMAR
    Father's Name: RAMESH KUMAR
    Date of Birth: 20/10/1988
    """
    extractor = PANExtractor()
    res = extractor.extract(sample).to_dict()

    assert res["doc_type"] == "pan"
    assert res["fields"]["pan_number"]["value"] == "ABCPE1234F"
    assert res["fields"]["dob"]["value"] == "1988-10-20"
    assert res["fields"]["name"]["value"] == "SURESH KUMAR"
    assert res["fields"]["father_name"]["value"] == "RAMESH KUMAR"
    assert res["fields"]["entity_type"]["value"] == "individual"


def test_income_certificate_extractor():
    """Test income certificate integer amount and validity parsing."""
    sample = """
    कार्यालय तहसीलदार
    Certificate No: INC/2025/99881
    प्रमाणित किया जाता है कि राहुल शर्मा सुपुत्र श्री मोहन शर्मा
    वार्षिक आय समस्त स्रोतों से Rs. 1,80,000/- (एक लाख अस्सी हजार रुपये) है।
    Date of Issue: 10/02/2025
    तहसीलदार
    """
    extractor = IncomeCertificateExtractor()
    res = extractor.extract(sample).to_dict()

    assert res["doc_type"] == "income_certificate"
    assert res["fields"]["annual_income"]["value"] == 180000
    assert res["fields"]["issue_date"]["value"] == "2025-02-10"
    assert res["fields"]["is_valid"]["value"] is True
    assert res["fields"]["issuing_authority"]["value"] == "Tehsildar"


def test_caste_certificate_extractor():
    """Test caste category, state of issue, and caste name extraction."""
    sample = """
    Government of Maharashtra
    Office of Sub-Divisional Magistrate
    Certificate No: CST/MH/2024/112
    This is to certify that Santosh Mali son of Tukaram Mali belongs to
    Other Backward Class (OBC) category.
    Issue Date: 12/06/2024
    """
    extractor = CasteCertificateExtractor()
    res = extractor.extract(sample).to_dict()

    assert res["doc_type"] == "caste_certificate"
    assert res["fields"]["category"]["value"] == "OBC"
    assert res["fields"]["state_of_issue"]["value"] == "Maharashtra"
    assert res["fields"]["issuing_authority"]["value"] == "Sub-Divisional Officer (SDO/SDM)"


def test_marksheet_extractor():
    """Test educational marksheet percentage calculation and board extraction."""
    sample = """
    Central Board of Secondary Education
    Senior Secondary School Examination (Class 12)
    Roll No: 6124567
    Candidate's Name: PRIYA SHARMA
    Grand Total: 425/500
    Percentage: 85.0%
    Year: 2023
    """
    extractor = MarksheetExtractor()
    res = extractor.extract(sample).to_dict()

    assert res["doc_type"] == "marksheet"
    assert res["fields"]["roll_no"]["value"] == "6124567"
    assert res["fields"]["marks_percentage"]["value"] == 85.0
    assert res["fields"]["year"]["value"] == 2023
    assert res["fields"]["qualification_level"]["value"] == "12th"


def test_disability_certificate_extractor():
    """Test disability percentage and type extraction."""
    sample = """
    Medical Board Certificate for Persons with Disability
    UDID: MH142023009988
    Name: ANIL JADHAV
    Locomotor Disability
    Percentage of Disability: 55%
    Date: 05/01/2023
    """
    extractor = DisabilityCertificateExtractor()
    res = extractor.extract(sample).to_dict()

    assert res["doc_type"] == "disability_certificate"
    assert res["fields"]["percentage"]["value"] == 55.0
    assert res["fields"]["disability_type"]["value"] == "Locomotor Disability"
    assert res["fields"]["udid_number"]["value"] == "MH142023009988"


def test_low_confidence_flagged_for_review():
    """Test that missing or low-confidence fields are flagged in needs_review."""
    blurry_sample = "UIDAI Aadhaar Card Name: Unknown"
    extractor = AadhaarExtractor()
    res = extractor.extract(blurry_sample).to_dict()

    # Critical fields like dob and gender are missing
    assert len(res["needs_review"]) > 0
    assert "dob" in res["needs_review"] or "aadhaar_last_4" in res["needs_review"]
    assert len(res["validation_errors"]) > 0


def test_pipeline_empty_and_graceful_failures():
    """Verify that empty files or corrupted inputs fail gracefully with clear errors, never crashing."""
    from backend.AI.extraction.pipeline import extract_certificate_features

    # 1. Empty bytes
    res_empty = extract_certificate_features(b"", file_name="empty.pdf")
    assert res_empty["doc_type"] == "unknown"
    assert len(res_empty["validation_errors"]) > 0
    assert "empty" in res_empty["validation_errors"][0].lower()

    # 2. Corrupt/random bytes
    res_random = extract_certificate_features(b"random_corrupt_non_image_payload", file_name="corrupt.jpg")
    assert "validation_errors" in res_random
    assert len(res_random["validation_errors"]) > 0

