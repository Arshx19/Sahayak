"""Domicile / Residence Certificate Feature Extractor.

Extracts:
- name
- state (Residency State)
- district
- issue_date (ISO format)
- certificate_number
"""

import re
from typing import Any, Dict, List, Optional
from ..validators import parse_iso_date
from .base import BaseExtractor, ExtractedField, ExtractionResult


class DomicileExtractor(BaseExtractor):
    """Rule-based extractor for Domicile / Residence Certificates."""

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
            r"(?:certificate\s*no|application\s*no|प्रमाण\s*पत्र\s*क्रमांक)[:\s]+([A-Z0-9\/\-]{6,25})",
            clean_text,
            re.IGNORECASE,
        )
        if cert_match:
            fields["certificate_number"] = ExtractedField(cert_match.group(1).strip(), confidence=0.92, source="regex")

        # 2. Extract Name
        name_match = re.search(
            r"(?:certified\s*that|प्रमाणित\s*किया\s*जाता\s*है\s*कि|shri|smt|श्री|श्रीमती)\s+([A-Za-z\s]{3,35})(?:\s+son|\s+daughter|\s+s/o|\s+d/o|\s+निवासी)",
            clean_text,
            re.IGNORECASE,
        )
        if name_match:
            fields["name"] = ExtractedField(name_match.group(1).strip(), confidence=0.85, source="regex")

        # 3. Extract State
        indian_states = [
            "Maharashtra", "Uttar Pradesh", "Bihar", "Karnataka", "Rajasthan",
            "Madhya Pradesh", "West Bengal", "Gujarat", "Tamil Nadu", "Kerala",
            "Punjab", "Haryana", "Odisha", "Telangana", "Andhra Pradesh", "Delhi",
            "Jharkhand", "Chhattisgarh", "Uttarakhand", "Himachal Pradesh", "Assam"
        ]
        for st in indian_states:
            if re.search(rf"\b(resident\s*of\s*{st}|state\s*of\s*{st}|government\s*of\s*{st}|{st}\s*राज्य|{st}\s*शासन)\b", clean_text, re.IGNORECASE):
                fields["state"] = ExtractedField(st, confidence=0.94, source="keyword")
                break
        if "state" not in fields:
            for st in indian_states:
                if re.search(rf"\b{st}\b", clean_text, re.IGNORECASE):
                    fields["state"] = ExtractedField(st, confidence=0.82, source="keyword")
                    break

        # 4. Extract District
        dist_match = re.search(
            r"(?:district|dist\.?|जिले|जनपद|तहसील)[:\s]+([A-Za-z\s]{3,25})",
            clean_text,
            re.IGNORECASE,
        )
        if dist_match:
            cand_dist = dist_match.group(1).strip()
            # Clean punctuation
            cand_dist = re.sub(r"[,;.]", "", cand_dist).strip()
            if len(cand_dist) >= 3 and "government" not in cand_dist.lower():
                fields["district"] = ExtractedField(cand_dist, confidence=0.85, source="regex")

        # 5. Extract Issue Date
        issue_match = re.search(r"\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b", clean_text)
        if issue_match:
            issue_date_iso = parse_iso_date(issue_match.group(1))
            if issue_date_iso:
                fields["issue_date"] = ExtractedField(issue_date_iso, confidence=0.88, source="regex")

        if "state" not in fields:
            fields["state"] = ExtractedField(None, confidence=0.0, source="missing", needs_confirmation=True)
            errors.append("Domicile: Domicile state could not be determined")

        return ExtractionResult("domicile_certificate", fields=fields, validation_errors=errors)
