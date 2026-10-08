"""PAN Card Feature Extractor.

Extracts:
- name
- father_name
- dob (ISO format YYYY-MM-DD)
- pan_number (Regex: [A-Z]{5}[0-9]{4}[A-Z])

Validates structural integrity of the Permanent Account Number.
"""

import re
from typing import Any, Dict, List, Optional
from ..validators import parse_iso_date, fix_numeric_ocr_errors
from .base import BaseExtractor, ExtractedField, ExtractionResult


class PANExtractor(BaseExtractor):
    """Rule-based extractor for Permanent Account Number (PAN) cards."""

    def extract(
        self,
        raw_text: str,
        ocr_lines: Optional[List[Any]] = None,
        qr_data: Optional[Dict[str, Any]] = None,
    ) -> ExtractionResult:
        fields: Dict[str, ExtractedField] = {}
        errors: List[str] = []

        clean_text = raw_text or ""

        # 1. Check QR code data first
        if qr_data and qr_data.get("parsed"):
            qr_f = qr_data["parsed"].get("fields", {})
            if qr_f.get("pan_number"):
                fields["pan_number"] = ExtractedField(qr_f["pan_number"], confidence=0.98, source="qr")
            if qr_f.get("name"):
                fields["name"] = ExtractedField(qr_f["name"], confidence=0.98, source="qr")
            if qr_f.get("father_name"):
                fields["father_name"] = ExtractedField(qr_f["father_name"], confidence=0.98, source="qr")
            if qr_f.get("dob"):
                fields["dob"] = ExtractedField(qr_f["dob"], confidence=0.98, source="qr")

        # 2. Extract PAN number via Regex: 5 letters, 4 digits, 1 letter
        if "pan_number" not in fields:
            # Fix potential OCR errors like 'O' in digit section
            pan_match = re.search(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b", clean_text)
            if not pan_match:
                # Try with case-insensitive and slight OCR repair
                loose_match = re.search(r"\b([A-Za-z]{5}[0-9OIlSB]{4}[A-Za-z])\b", clean_text)
                if loose_match:
                    raw_pan = loose_match.group(1).upper()
                    # Fix middle 4 numeric characters
                    repaired_middle = fix_numeric_ocr_errors(raw_pan[5:9])
                    repaired_pan = raw_pan[:5] + repaired_middle + raw_pan[9]
                    if re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", repaired_pan):
                        fields["pan_number"] = ExtractedField(repaired_pan, confidence=0.85, source="regex_repaired")
            else:
                fields["pan_number"] = ExtractedField(pan_match.group(1), confidence=0.96, source="regex")

        # Validate PAN structure
        if "pan_number" in fields:
            p_val = fields["pan_number"].value
            if p_val and len(p_val) == 10:
                fourth_char = p_val[3]
                if fourth_char != "P":
                    # P stands for Person / Individual
                    fields["entity_type"] = ExtractedField("non_individual", confidence=0.90, source="pan_structure")
                else:
                    fields["entity_type"] = ExtractedField("individual", confidence=0.95, source="pan_structure")

        # 3. Extract DOB
        if "dob" not in fields:
            dob_match = re.search(
                r"(?:date\s*of\s*birth|dob|जन्म\s*तिथि)[:\s]+([0-9\/\-\.]{8,10})",
                clean_text,
                re.IGNORECASE,
            )
            if not dob_match:
                # Direct DD/MM/YYYY pattern
                dob_match = re.search(r"\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b", clean_text)

            if dob_match:
                iso_dob = parse_iso_date(dob_match.group(1))
                if iso_dob:
                    fields["dob"] = ExtractedField(iso_dob, confidence=0.90, source="regex")

        # 4. Extract Father's Name and Name from OCR lines
        lines = [ln.strip() for ln in clean_text.splitlines() if ln.strip()]
        for i, line in enumerate(lines):
            # Father's name anchor
            if re.search(r"(?:father['’]?s\s*name|पिता\s*का\s*नाम)", line, re.IGNORECASE):
                # Target is usually on this line after colon or next line
                colon_split = re.split(r"[:\-]", line)
                if len(colon_split) > 1 and len(colon_split[1].strip()) >= 3:
                    cand = colon_split[1].strip()
                    fields["father_name"] = ExtractedField(cand, confidence=0.85, source="ocr")
                elif i + 1 < len(lines):
                    cand = lines[i + 1].strip()
                    if re.match(r"^[A-Za-z\s]{3,40}$", cand):
                        fields["father_name"] = ExtractedField(cand, confidence=0.82, source="ocr")

            # Name anchor
            if re.search(r"(?:^name|नाम)[:\s]+([A-Za-z\s]{3,40})", line, re.IGNORECASE):
                cand = re.search(r"(?:^name|नाम)[:\s]+([A-Za-z\s]{3,40})", line, re.IGNORECASE).group(1).strip()
                if "income" not in cand.lower() and "government" not in cand.lower():
                    fields["name"] = ExtractedField(cand, confidence=0.85, source="ocr")

        # Fallback name extraction from line above Father's Name if name not set
        if "name" not in fields and "father_name" in fields:
            for i, line in enumerate(lines):
                if re.search(r"(?:father['’]?s\s*name|पिता)", line, re.IGNORECASE) and i > 0:
                    cand = lines[i - 1].strip()
                    if re.match(r"^[A-Za-z\s]{3,40}$", cand) and "department" not in cand.lower():
                        fields["name"] = ExtractedField(cand, confidence=0.75, source="heuristic")
                        break

        # Check required fields
        if "pan_number" not in fields:
            fields["pan_number"] = ExtractedField(None, confidence=0.0, source="missing", needs_confirmation=True)
            errors.append("PAN: Missing or unreadable PAN number")

        return ExtractionResult("pan", fields=fields, validation_errors=errors)
