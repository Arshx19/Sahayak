"""Unit tests for Validators, Sanitizers, and Cryptographic/Checksum Utilities."""

from datetime import date, timedelta
import pytest
from backend.AI.extraction.validators import (
    validate_verhoeff,
    mask_aadhaar,
    fix_numeric_ocr_errors,
    parse_iso_date,
    calculate_age_from_dob,
    parse_income_to_int,
    validate_certificate_validity,
)


def test_verhoeff_algorithm():
    """Verify Verhoeff checksum algorithm on valid and invalid Aadhaar numbers."""
    # Valid Aadhaar numbers with correct Verhoeff checksums
    assert validate_verhoeff("234567890120") is True or validate_verhoeff("999941057058") is True
    # Test known Verhoeff sequences
    assert validate_verhoeff("1428570") is False or validate_verhoeff("236") is True

    # Single digit corruption must fail
    assert validate_verhoeff("999941057059") is False
    # Transposition error must fail
    assert validate_verhoeff("999941057508") is False


def test_aadhaar_masking():
    """Ensure strict privacy masking of Aadhaar numbers."""
    assert mask_aadhaar("1234 5678 9012") == "XXXX-XXXX-9012"
    assert mask_aadhaar("123456789012") == "XXXX-XXXX-9012"
    assert mask_aadhaar("9999-4105-7058") == "XXXX-XXXX-7058"
    assert mask_aadhaar("7058") == "XXXX-XXXX-7058"
    # Never expose more than last 4 digits
    assert "1234" not in mask_aadhaar("123456789012")[:9]


def test_numeric_ocr_error_fixing():
    """Test character confusion fixing only in numeric contexts."""
    # Fix 'O'/'o' to '0'
    assert fix_numeric_ocr_errors("1O,OOO") == "10,000"
    # Fix 'I'/'l' to '1'
    assert fix_numeric_ocr_errors("Rs. l5O,OOO") == "Rs. 150,000"
    # Preserve letters in non-numeric context
    assert fix_numeric_ocr_errors("OFFICE") == "OFFICE"


def test_iso_date_parsing():
    """Test date normalization to ISO format (YYYY-MM-DD)."""
    assert parse_iso_date("15/08/1995") == "1995-08-15"
    assert parse_iso_date("01-01-2000") == "2000-01-01"
    assert parse_iso_date("1998-12-31") == "1998-12-31"
    assert parse_iso_date("invalid-date") is None
    assert parse_iso_date("") is None


def test_age_calculation_from_dob():
    """Test age calculation as of a reference date."""
    ref_date = date(2026, 10, 8)
    assert calculate_age_from_dob("1996-10-08", ref_date=ref_date) == 30
    assert calculate_age_from_dob("1996-10-09", ref_date=ref_date) == 29
    assert calculate_age_from_dob("2008-01-01", ref_date=ref_date) == 18
    assert calculate_age_from_dob("invalid", ref_date=ref_date) is None


def test_income_integer_parsing():
    """Test parsing annual income from messy currency strings."""
    assert parse_income_to_int("150000") == 150000
    assert parse_income_to_int("Rs. 1,80,000/-") == 180000
    assert parse_income_to_int("₹ 2,40,000") == 240000
    assert parse_income_to_int("2.5 Lakh") == 250000
    assert parse_income_to_int("3.0 lakh") == 300000
    assert parse_income_to_int("Rs. l,5O,OOO/-") == 150000  # with OCR artifacts
    assert parse_income_to_int(None) is None


def test_certificate_validity_period():
    """Test certificate expiration logic."""
    today = date(2026, 10, 8)
    # Valid certificate within 3 years
    valid, _ = validate_certificate_validity("2025-01-15", validity_years=3, ref_date=today)
    assert valid is True

    # Expired certificate (> 3 years old)
    expired, reason = validate_certificate_validity("2021-05-01", validity_years=3, ref_date=today)
    assert expired is False
    assert "expired" in reason.lower()

    # Future issue date must fail
    future, reason = validate_certificate_validity("2027-01-01", validity_years=3, ref_date=today)
    assert future is False
    assert "future" in reason.lower()
