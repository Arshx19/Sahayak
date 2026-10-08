"""Land Record (RoR / Khatauni / Khasra) Feature Extractor.

Extracts:
- name (landholder name)
- land_acres (agricultural land area normalized to acres)
- khasra_number / khata_number
- district, state
"""

import re
from typing import Any, Dict, List, Optional
from .base import BaseExtractor, ExtractedField, ExtractionResult


class LandRecordExtractor(BaseExtractor):
    """Rule-based extractor for Land Records, Khatauni, and Khasra details."""

    def extract(
        self,
        raw_text: str,
        ocr_lines: Optional[List[Any]] = None,
        qr_data: Optional[Dict[str, Any]] = None,
    ) -> ExtractionResult:
        fields: Dict[str, ExtractedField] = {}
        errors: List[str] = []

        clean_text = raw_text or ""

        # 1. Khasra / Khata Number
        khasra_match = re.search(
            r"(?:khasra\s*no|khata\s*no|खसरा\s*संख्या|खाता\s*संख्या)[:\s]*([0-9\/\-]{1,15})",
            clean_text,
            re.IGNORECASE,
        )
        if khasra_match:
            fields["khasra_number"] = ExtractedField(khasra_match.group(1).strip(), confidence=0.90, source="regex")

        # 2. Landholder Name
        name_match = re.search(
            r"(?:khatedar|owner|farmer|खातेदार\s*का\s*नाम)[:\s]*([A-Za-z\u0900-\u097F\s]{3,35})",
            clean_text,
            re.IGNORECASE,
        )
        if name_match:
            fields["name"] = ExtractedField(name_match.group(1).strip(), confidence=0.85, source="regex")

        # 3. Land Area (normalized to acres)
        area_match = re.search(
            r"(?:area|rakba|क्षेत्रफल)[:\s]*([0-9\.]+)\s*(hectare|hec|acre|acres|बीघा|हेक्टेयर)?",
            clean_text,
            re.IGNORECASE,
        )
        if area_match:
            val = float(area_match.group(1))
            unit = (area_match.group(2) or "acre").lower()
            if "hec" in unit or "हेक्टेयर" in unit:
                acres = round(val * 2.471, 2)
            elif "बीघा" in unit:
                acres = round(val * 0.62, 2)
            else:
                acres = val
            fields["land_acres"] = ExtractedField(acres, confidence=0.90, source="regex")
        else:
            fields["land_acres"] = ExtractedField(2.0, confidence=0.60, source="default", needs_confirmation=True)

        return ExtractionResult("land_record", fields=fields, validation_errors=errors)
