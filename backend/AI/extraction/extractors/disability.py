"""Disability Certificate Feature Extractor.

Extracts:
- name
- disability_type (Locomotor, Visual, Hearing, Intellectual, Multiple)
- percentage (Disability percentage integer/float, e.g. 40, 60, 75)
- issue_date (ISO format)
- udid_number (Unique Disability ID)
"""

import re
from typing import Any, Dict, List, Optional
from ..validators import parse_iso_date, fix_numeric_ocr_errors
from .base import BaseExtractor, ExtractedField, ExtractionResult


class DisabilityCertificateExtractor(BaseExtractor):
    """Rule-based extractor for UDID / Medical Disability Certificates."""

    def extract(
        self,
        raw_text: str,
        ocr_lines: Optional[List[Any]] = None,
        qr_data: Optional[Dict[str, Any]] = None,
    ) -> ExtractionResult:
        fields: Dict[str, ExtractedField] = {}
        errors: List[str] = []

        clean_text = raw_text or ""

        # 1. UDID / Certificate Number
        udid_match = re.search(r"(?:udid|card\s*number|cert(?:ificate)?\s*no)[:\s]*([A-Z0-9\/\-]{8,22})", clean_text, re.IGNORECASE)
        if udid_match:
            fields["udid_number"] = ExtractedField(udid_match.group(1).strip(), confidence=0.92, source="regex")

        # 2. Extract Name
        name_match = re.search(
            r"(?:name|shri|smt|नाम)[:\s]+([A-Za-z\s]{3,35})(?:\s+s/o|\s+d/o|\s+age)?",
            clean_text,
            re.IGNORECASE,
        )
        if name_match:
            cand = name_match.group(1).strip()
            if "disability" not in cand.lower():
                fields["name"] = ExtractedField(cand, confidence=0.85, source="regex")

        # 3. Extract Disability Percentage (Crucial for welfare eligibility, e.g. >= 40%)
        perc_match = re.search(
            r"(?:percentage\s*of\s*disability|disability\s*is|divyangta)[:\s]*([0-9OIlSB]{1,3}(?:\.[0-9]{1,2})?)\s*%",
            clean_text,
            re.IGNORECASE,
        )
        if not perc_match:
            perc_match = re.search(r"\b([4-9][0-9]|100)\s*%\b", clean_text)

        if perc_match:
            raw_p = fix_numeric_ocr_errors(perc_match.group(1).strip())
            try:
                p_val = float(raw_p)
                if 0 <= p_val <= 100:
                    fields["percentage"] = ExtractedField(p_val, confidence=0.95, source="regex")
            except ValueError:
                pass

        if "percentage" not in fields:
            fields["percentage"] = ExtractedField(None, confidence=0.0, source="missing", needs_confirmation=True)
            errors.append("Disability Certificate: Disability percentage not found")

        # 4. Extract Disability Type
        types = [
            ("Locomotor Disability", ["locomotor", "orthopedic", "हड्डी"]),
            ("Visual Impairment", ["visual", "blindness", "low vision", "दृष्टि"]),
            ("Hearing Impairment", ["hearing", "deaf", "श्रवण"]),
            ("Mental / Intellectual Disability", ["intellectual", "mental", "autism", "मानसिक"]),
            ("Multiple Disabilities", ["multiple disabilities", "बहु-दिव्यांगता"]),
        ]
        for type_label, aliases in types:
            if any(re.search(rf"\b{re.escape(al)}\b", clean_text, re.IGNORECASE) for al in aliases):
                fields["disability_type"] = ExtractedField(type_label, confidence=0.90, source="keyword")
                break
        if "disability_type" not in fields:
            fields["disability_type"] = ExtractedField("General Disability", confidence=0.70, source="default")

        # 5. Extract Issue Date
        issue_match = re.search(r"\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b", clean_text)
        if issue_match:
            issue_date_iso = parse_iso_date(issue_match.group(1))
            if issue_date_iso:
                fields["issue_date"] = ExtractedField(issue_date_iso, confidence=0.88, source="regex")

        return ExtractionResult("disability_certificate", fields=fields, validation_errors=errors)
