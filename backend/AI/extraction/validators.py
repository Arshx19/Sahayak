"""Validation and Sanitization Utilities for Government Certificate Extraction.

Enforces:
1. Verhoeff checksum algorithm for Aadhaar validation.
2. Strict Aadhaar masking (all but last 4 digits masked: XXXX-XXXX-1234).
3. OCR character error fixing (O/0, I/1, S/5) applied exclusively to numeric fields.
4. Robust ISO date normalization (DD/MM/YYYY -> YYYY-MM-DD) and age calculation.
5. Income integer parsing and certificate validity checking.
"""

from datetime import date, datetime
import re
from typing import Any, Dict, Optional, Tuple


# =============================================================================
# VERHOEFF ALGORITHM TABLES
# =============================================================================
_VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]

_VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]

_VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def validate_verhoeff(number_str: str) -> bool:
    """Validate a numeric string against the Verhoeff checksum algorithm."""
    clean = re.sub(r"\D", "", str(number_str))
    if not clean:
        return False
    c = 0
    reversed_digits = [int(x) for x in reversed(clean)]
    for i, digit in enumerate(reversed_digits):
        c = _VERHOEFF_D[c][_VERHOEFF_P[i % 8][digit]]
    return c == 0


def mask_aadhaar(aadhaar_str: str) -> str:
    """
    Mask all but the last 4 digits of an Aadhaar number.
    Returns format: XXXX-XXXX-1234
    """
    digits = re.sub(r"\D", "", str(aadhaar_str))
    if len(digits) >= 4:
        last4 = digits[-4:]
        return f"XXXX-XXXX-{last4}"
    return "XXXX-XXXX-XXXX"


def fix_numeric_ocr_errors(raw_text: str) -> str:
    """
    Fix common OCR character confusions ONLY in expected numeric contexts.
    Converts 'O'/'o' to '0', 'I'/'l'/'|' to '1' in numeric strings, amounts, and percentages.
    Preserves regular words like 'OFFICE', 'GOVERNMENT', or 'Lakh'.
    """
    if not raw_text:
        return ""

    def repair_token(token: str) -> str:
        clean_tok = re.sub(r"[,./\-₹%]", "", token).strip()
        if not clean_tok:
            return token
        has_digit = any(c.isdigit() for c in clean_tok)
        is_confusion_heavy = all(c.isdigit() or c in "OolI|" for c in clean_tok) and len(clean_tok) > 1

        if (has_digit and is_confusion_heavy) or (is_confusion_heavy and len(clean_tok) >= 3):
            mapping = {"O": "0", "o": "0", "I": "1", "l": "1", "|": "1"}
            return "".join(mapping.get(c, c) for c in token)
        return token

    tokens = re.split(r"(\s+)", raw_text)
    repaired = [repair_token(t) for t in tokens]
    return "".join(repaired)


def parse_iso_date(date_str: str) -> Optional[str]:
    """
    Normalize various date string formats to ISO format (YYYY-MM-DD).
    Supported formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD Month YYYY, etc.
    """
    if not date_str or not isinstance(date_str, str):
        return None
    cleaned = date_str.strip().replace(".", "-").replace("/", "-")
    # Clean up Hindi/OCR artifacts
    cleaned = re.sub(r"\s+", " ", cleaned)

    date_patterns = [
        "%d-%m-%Y",
        "%Y-%m-%d",
        "%d-%m-%y",
        "%d %B %Y",
        "%d %b %Y",
        "%B %d, %Y",
    ]
    for fmt in date_patterns:
        try:
            parsed = datetime.strptime(cleaned, fmt).date()
            return parsed.isoformat()
        except ValueError:
            continue

    # Regex heuristic fallback
    match = re.search(r"(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})", date_str)
    if match:
        d, m, y = match.groups()
        if len(y) == 2:
            y = f"20{y}" if int(y) < 50 else f"19{y}"
        try:
            parsed = datetime(int(y), int(m), int(d)).date()
            return parsed.isoformat()
        except ValueError:
            pass

    return None


def calculate_age_from_dob(dob_iso: str, ref_date: Optional[date] = None) -> Optional[int]:
    """Calculate age in complete years given an ISO date of birth (YYYY-MM-DD)."""
    if not dob_iso:
        return None
    try:
        born = datetime.strptime(dob_iso, "%Y-%m-%d").date()
        today = ref_date or date.today()
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
    except Exception:
        return None


def parse_income_to_int(income_val: Any) -> Optional[int]:
    """
    Extract and normalize annual income to an integer in INR.
    Handles 'Rs. 1,50,000/-', '1.5 Lakh', '150000', '₹ 2,40,000'.
    """
    if income_val is None:
        return None
    if isinstance(income_val, (int, float)):
        return int(income_val)

    raw_text = str(income_val).lower().replace(",", "").replace("/-", "")

    # Check for 'lakh' / 'lac' notation first
    lakh_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs|lakhs)", raw_text)
    if lakh_match:
        try:
            return int(float(lakh_match.group(1)) * 100000)
        except ValueError:
            pass

    # Fix numeric OCR artifacts
    text = fix_numeric_ocr_errors(raw_text)

    # Extract digits sequence
    num_match = re.search(r"\b\d{4,8}\b", text)
    if num_match:
        try:
            return int(num_match.group(0))
        except ValueError:
            pass

    digits_only = re.sub(r"\D", "", text)
    if digits_only and len(digits_only) >= 4:
        try:
            return int(digits_only)
        except ValueError:
            pass

    return None


def validate_certificate_validity(
    issue_date_iso: Optional[str],
    validity_years: int = 1,
    ref_date: Optional[date] = None,
) -> Tuple[bool, Optional[str]]:
    """
    Validate if a certificate with a given issue date is currently valid.
    Returns (is_valid, reason).
    """
    if not issue_date_iso:
        return True, "No issue date specified, assuming active"
    try:
        issue_d = datetime.strptime(issue_date_iso, "%Y-%m-%d").date()
        today = ref_date or date.today()
        if issue_d > today:
            return False, "Issue date is in the future"

        # Check expiration based on standard validity duration
        max_age_days = validity_years * 365 + (validity_years // 4)
        age_days = (today - issue_d).days
        if age_days > max_age_days:
            return False, f"Certificate expired ({age_days // 365} year(s) old, validity is {validity_years} year(s))"
        return True, "Valid"
    except Exception as e:
        return False, f"Invalid issue date format: {str(e)}"
