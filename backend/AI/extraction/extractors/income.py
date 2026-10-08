"""Income Certificate Feature Extractor.

Extracts:
- name
- father_name
- annual_income (integer in INR)
- issuing_authority (Tehsildar / SDM / Revenue Inspector)
- issue_date (ISO format)
- validity (is_valid boolean and validity duration)
- certificate_number
"""

import re
from typing import Any, Dict, List, Optional
from ..validators import (
    parse_income_to_int,
    parse_iso_date,
    validate_certificate_validity,
    fix_numeric_ocr_errors,
)
from .base import BaseExtractor, ExtractedField, ExtractionResult


class IncomeCertificateExtractor(BaseExtractor):
    """Rule-based extractor for State Income Certificates."""

    def extract(
        self,
        raw_text: str,
        ocr_lines: Optional[List[Any]] = None,
        qr_data: Optional[Dict[str, Any]] = None,
    ) -> ExtractionResult:
        fields: Dict[str, ExtractedField] = {}
        errors: List[str] = []

        clean_text = raw_text or ""

        # 1. Certificate Number
        cert_match = re.search(
            r"(?:certificate\s*no|application\s*no|प्रमाण\s*पत्र\s*क्रमांक|आवेदन\s*क्रमांक)[:\s]+([A-Z0-9\/\-]{6,25})",
            clean_text,
            re.IGNORECASE,
        )
        if cert_match:
            fields["certificate_number"] = ExtractedField(cert_match.group(1).strip(), confidence=0.92, source="regex")

        # 2. Extract Applicant Name
        name_match = re.search(
            r"(?:certified\s*that|प्रमाणित\s*किया\s*जाता\s*है\s*कि|shri|smt|श्री|श्रीमती)\s+([A-Za-z\s]{3,35})(?:\s+son|\s+daughter|\s+wife|\s+आत्मज|\s+सुपुत्र)",
            clean_text,
            re.IGNORECASE,
        )
        if name_match:
            cand_name = name_match.group(1).strip()
            fields["name"] = ExtractedField(cand_name, confidence=0.85, source="regex")

        # 3. Extract Father's / Husband's Name
        father_match = re.search(
            r"(?:son\s*of|daughter\s*of|s/o|d/o|w/o|सुपुत्र|आत्मज|पिता\s*का\s*नाम)[:\s]+(?:shri|श्री\s+)?([A-Za-z\s]{3,35})",
            clean_text,
            re.IGNORECASE,
        )
        if father_match:
            cand_f = father_match.group(1).strip()
            fields["father_name"] = ExtractedField(cand_f, confidence=0.83, source="regex")

        # 4. Extract Annual Income (Integer)
        # Search for patterns like:
        # "annual income is Rs. 1,20,000" or "वार्षिक आय 120000 रुपये"
        income_match = re.search(
            r"(?:annual\s*income|total\s*income|वार्षिक\s*आय|समस्त\s*स्रोतों\s*से\s*आय)[^\d]{1,25}(?:rs\.?|inr|₹)?\s*([0-9,OIlSB\.\s]+(?:\s*lakh)?)",
            clean_text,
            re.IGNORECASE,
        )
        income_int = None
        if income_match:
            raw_inc = income_match.group(1).strip()
            income_int = parse_income_to_int(raw_inc)

        if not income_int:
            # Broader numeric regex near 'income' keyword
            alt_match = re.search(r"(?:आय|income)[^\n\r]*?(\d{1,2}[,.]\d{2}[,.]\d{3}|\d{4,8})", clean_text, re.IGNORECASE)
            if alt_match:
                income_int = parse_income_to_int(alt_match.group(1))

        if income_int is not None:
            # Sensitive field: valid integer
            fields["annual_income"] = ExtractedField(income_int, confidence=0.90, source="regex")
        else:
            fields["annual_income"] = ExtractedField(None, confidence=0.0, source="missing", needs_confirmation=True)
            errors.append("Income Certificate: Annual income amount could not be detected")

        # 5. Extract Issuing Authority
        authority_anchors = [
            ("Tehsildar", ["tehsildar", "तहसीलदार"]),
            ("Sub-Divisional Magistrate (SDM)", ["sub divisional magistrate", "sdm", "उप जिलाधिकारी"]),
            ("Revenue Officer", ["revenue officer", "revenue inspector", "राजस्व अधिकारी"]),
            ("District Magistrate", ["district magistrate", "जिलाधिकारी"]),
        ]
        for auth_label, aliases in authority_anchors:
            if any(re.search(rf"\b{re.escape(alias)}\b", clean_text, re.IGNORECASE) for alias in aliases):
                fields["issuing_authority"] = ExtractedField(auth_label, confidence=0.90, source="keyword")
                break
        if "issuing_authority" not in fields:
            fields["issuing_authority"] = ExtractedField("Competent Revenue Authority", confidence=0.70, source="default")

        # 6. Extract Issue Date & Validate Expiry
        issue_match = re.search(
            r"(?:date\s*of\s*issue|issue\s*date|दिनांक|जारी\s*करने\s*की\s*तिथि)[:\s]+([0-9\/\-\.]{8,10})",
            clean_text,
            re.IGNORECASE,
        )
        if not issue_match:
            issue_match = re.search(r"\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b", clean_text)

        issue_date_iso = None
        if issue_match:
            issue_date_iso = parse_iso_date(issue_match.group(1))
            if issue_date_iso:
                fields["issue_date"] = ExtractedField(issue_date_iso, confidence=0.88, source="regex")

        # Check validity (standard income certificate validity: 3 years in most states, or 1 year)
        if issue_date_iso:
            is_valid, reason = validate_certificate_validity(issue_date_iso, validity_years=3)
            fields["is_valid"] = ExtractedField(is_valid, confidence=0.95, source="validator")
            if not is_valid:
                errors.append(f"Income Certificate Validity: {reason}")
        else:
            fields["is_valid"] = ExtractedField(True, confidence=0.60, source="assumption", needs_confirmation=True)

        return ExtractionResult("income_certificate", fields=fields, validation_errors=errors)
