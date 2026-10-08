"""Aadhaar Card Feature Extractor.

Extracts:
- name
- dob (ISO format YYYY-MM-DD)
- gender (Male / Female / Transgender)
- state, district, pincode
- aadhaar_last_4 (strictly masked: XXXX-XXXX-1234)

Applies Verhoeff checksum algorithm and privacy-preserving masking.
"""

import re
from typing import Any, Dict, List, Optional
from ..validators import (
    mask_aadhaar,
    parse_iso_date,
    validate_verhoeff,
    fix_numeric_ocr_errors,
)
from .base import BaseExtractor, ExtractedField, ExtractionResult


class AadhaarExtractor(BaseExtractor):
    """Rule-based extractor for Aadhaar cards with QR code cross-check."""

    def extract(
        self,
        raw_text: str,
        ocr_lines: Optional[List[Any]] = None,
        qr_data: Optional[Dict[str, Any]] = None,
    ) -> ExtractionResult:
        fields: Dict[str, ExtractedField] = {}
        errors: List[str] = []

        # 1. First priority: Check if decoded QR data exists
        if qr_data and qr_data.get("parsed", {}).get("parsed_type") == "aadhaar":
            qr_f = qr_data["parsed"]["fields"]
            if qr_f.get("name"):
                fields["name"] = ExtractedField(qr_f["name"], confidence=0.98, source="qr")
            if qr_f.get("dob"):
                fields["dob"] = ExtractedField(qr_f["dob"], confidence=0.98, source="qr")
            if qr_f.get("gender"):
                fields["gender"] = ExtractedField(qr_f["gender"], confidence=0.98, source="qr")
            if qr_f.get("aadhaar_last_4"):
                fields["aadhaar_last_4"] = ExtractedField(qr_f["aadhaar_last_4"], confidence=0.99, source="qr")
            if qr_f.get("state"):
                fields["state"] = ExtractedField(qr_f["state"], confidence=0.95, source="qr")
            if qr_f.get("district"):
                fields["district"] = ExtractedField(qr_f["district"], confidence=0.95, source="qr")
            if qr_f.get("pincode"):
                fields["pincode"] = ExtractedField(qr_f["pincode"], confidence=0.95, source="qr")

        # 2. Extract Aadhaar Number from OCR / Text
        # Fix OCR numbers if needed
        clean_text = raw_text or ""
        # Match pattern: 4 digits + space + 4 digits + space + 4 digits
        uid_match = re.search(r"\b(\d{4}\s\d{4}\s\d{4})\b", clean_text)
        if not uid_match:
            # Try with hyphens or slight OCR noise
            uid_match = re.search(r"\b(\d{4}[-\s]\d{4}[-\s]\d{4})\b", clean_text)

        if uid_match:
            raw_uid = re.sub(r"\D", "", uid_match.group(1))
            if len(raw_uid) == 12:
                is_checksum_valid = validate_verhoeff(raw_uid)
                masked_no = mask_aadhaar(raw_uid)
                conf = 0.95 if is_checksum_valid else 0.60
                if not is_checksum_valid:
                    errors.append("Aadhaar Verhoeff checksum verification failed")
                if "aadhaar_last_4" not in fields or fields["aadhaar_last_4"].confidence < conf:
                    fields["aadhaar_last_4"] = ExtractedField(
                        masked_no[-4:],
                        confidence=conf,
                        source="regex",
                        needs_confirmation=not is_checksum_valid,
                    )

        # 3. Extract DOB
        if "dob" not in fields:
            # Pattern: DOB / Date of Birth / जन्म तिथि : DD/MM/YYYY
            dob_match = re.search(
                r"(?:dob|date\s*of\s*birth|जन्म\s*तिथि|year\s*of\s*birth|yob)[:\s]+([0-9\/\-\.]{4,10})",
                clean_text,
                re.IGNORECASE,
            )
            if dob_match:
                raw_dob = dob_match.group(1).strip()
                iso_dob = parse_iso_date(raw_dob)
                if iso_dob:
                    fields["dob"] = ExtractedField(iso_dob, confidence=0.88, source="regex")
                elif len(raw_dob) == 4 and raw_dob.isdigit():  # YOB only
                    fields["dob"] = ExtractedField(f"{raw_dob}-01-01", confidence=0.75, source="regex")

        # 4. Extract Gender
        if "gender" not in fields:
            if re.search(r"\b(male|पुरुष)\b", clean_text, re.IGNORECASE):
                fields["gender"] = ExtractedField("Male", confidence=0.92, source="keyword")
            elif re.search(r"\b(female|महिला|स्त्री)\b", clean_text, re.IGNORECASE):
                fields["gender"] = ExtractedField("Female", confidence=0.92, source="keyword")
            elif re.search(r"\b(transgender|तृतीय पंथी)\b", clean_text, re.IGNORECASE):
                fields["gender"] = ExtractedField("Transgender", confidence=0.92, source="keyword")

        # 5. Extract Pincode
        if "pincode" not in fields:
            pin_match = re.search(r"\b([1-9][0-9]{5})\b", clean_text)
            if pin_match:
                fields["pincode"] = ExtractedField(pin_match.group(1), confidence=0.85, source="regex")

        # 6. Extract State / District heuristics from address line
        if "state" not in fields:
            # Match common Indian state names
            indian_states = [
                "Maharashtra", "Uttar Pradesh", "Bihar", "Karnataka", "Rajasthan",
                "Madhya Pradesh", "West Bengal", "Gujarat", "Tamil Nadu", "Kerala",
                "Punjab", "Haryana", "Odisha", "Telangana", "Andhra Pradesh", "Delhi",
                "Jharkhand", "Chhattisgarh", "Uttarakhand", "Himachal Pradesh", "Assam"
            ]
            for st in indian_states:
                if re.search(rf"\b{st}\b", clean_text, re.IGNORECASE):
                    fields["state"] = ExtractedField(st, confidence=0.85, source="keyword")
                    break

        # 7. Extract Name if not found in QR
        if "name" not in fields:
            # Heuristic: line above DOB or after 'To' / 'Name'
            lines = [ln.strip() for ln in clean_text.splitlines() if ln.strip()]
            for i, line in enumerate(lines):
                if re.search(r"(?:dob|date\s*of\s*birth|जन्म)", line, re.IGNORECASE) and i > 0:
                    candidate = lines[i - 1]
                    # Check that line looks like a valid name (alphabets + spaces, length 3-40)
                    if re.match(r"^[A-Za-z\s]{3,40}$", candidate) and "government" not in candidate.lower():
                        fields["name"] = ExtractedField(candidate, confidence=0.75, source="heuristic")
                        break

        # Flag missing critical fields
        for critical in ["aadhaar_last_4", "dob", "gender"]:
            if critical not in fields:
                fields[critical] = ExtractedField(
                    value=None,
                    confidence=0.0,
                    source="missing",
                    needs_confirmation=True,
                )
                errors.append(f"Aadhaar: Missing or unreadable {critical}")

        return ExtractionResult("aadhaar", fields=fields, validation_errors=errors)
