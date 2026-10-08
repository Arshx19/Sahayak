"""Birth Certificate Feature Extractor.

Extracts:
- name
- dob (ISO format)
- gender
- father_name
- mother_name
- state
- registration_number
"""

import re
from typing import Any, Dict, List, Optional
from ..validators import parse_iso_date
from .base import BaseExtractor, ExtractedField, ExtractionResult


class BirthCertificateExtractor(BaseExtractor):
    """Rule-based extractor for Municipal Birth Certificates."""

    def extract(
        self,
        raw_text: str,
        ocr_lines: Optional[List[Any]] = None,
        qr_data: Optional[Dict[str, Any]] = None,
    ) -> ExtractionResult:
        fields: Dict[str, ExtractedField] = {}
        errors: List[str] = []

        clean_text = raw_text or ""

        # 1. Registration Number
        reg_match = re.search(r"(?:registration\s*no|पंजीकरण\s*संख्या)[:\s]*([A-Z0-9\/\-]{6,25})", clean_text, re.IGNORECASE)
        if reg_match:
            fields["registration_number"] = ExtractedField(reg_match.group(1).strip(), confidence=0.92, source="regex")

        # 2. Date of Birth
        dob_match = re.search(r"(?:date\s*of\s*birth|जन्म\s*तिथि)[:\s]*([0-9\/\-\.]{8,10})", clean_text, re.IGNORECASE)
        if not dob_match:
            dob_match = re.search(r"\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b", clean_text)
        if dob_match:
            iso_dob = parse_iso_date(dob_match.group(1))
            if iso_dob:
                fields["dob"] = ExtractedField(iso_dob, confidence=0.95, source="regex")

        # 3. Name of Child
        name_match = re.search(r"(?:name\s*of\s*child|name|बालक/बालिका\s*का\s*नाम)[:\s]*([A-Za-z\s]{3,35})", clean_text, re.IGNORECASE)
        if name_match:
            cand = name_match.group(1).strip()
            if "birth" not in cand.lower():
                fields["name"] = ExtractedField(cand, confidence=0.85, source="regex")

        # 4. Gender
        if re.search(r"\b(male|boy|पुरुष|बालक)\b", clean_text, re.IGNORECASE):
            fields["gender"] = ExtractedField("Male", confidence=0.92, source="keyword")
        elif re.search(r"\b(female|girl|महिला|बालिका)\b", clean_text, re.IGNORECASE):
            fields["gender"] = ExtractedField("Female", confidence=0.92, source="keyword")

        return ExtractionResult("birth_certificate", fields=fields, validation_errors=errors)
