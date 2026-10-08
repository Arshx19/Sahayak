"""Ration Card / BPL Certificate Feature Extractor.

Extracts:
- card_type (BPL, AAY / Antyodaya, PHH, APL)
- family_size (integer count of family members)
- state (Issuing state)
- ration_card_number
- head_of_family
"""

import re
from typing import Any, Dict, List, Optional
from .base import BaseExtractor, ExtractedField, ExtractionResult


class RationBplExtractor(BaseExtractor):
    """Rule-based extractor for NFSA Ration Cards and BPL certificates."""

    def extract(
        self,
        raw_text: str,
        ocr_lines: Optional[List[Any]] = None,
        qr_data: Optional[Dict[str, Any]] = None,
    ) -> ExtractionResult:
        fields: Dict[str, ExtractedField] = {}
        errors: List[str] = []

        clean_text = raw_text or ""

        # 1. Ration Card Number
        rc_match = re.search(
            r"(?:ration\s*card\s*no|card\s*no|राशन\s*कार्ड\s*संख्या)[:\s]*([0-9]{10,16})",
            clean_text,
            re.IGNORECASE,
        )
        if rc_match:
            fields["ration_card_number"] = ExtractedField(rc_match.group(1).strip(), confidence=0.92, source="regex")

        # 2. Card Type (AAY / BPL / PHH / NFSA)
        if re.search(r"\b(antyodaya|aay|अन्त्योदय)\b", clean_text, re.IGNORECASE):
            fields["card_type"] = ExtractedField("AAY", confidence=0.95, source="keyword")
            fields["is_bpl"] = ExtractedField(True, confidence=0.98, source="rule")
        elif re.search(r"\b(bpl|below\s*poverty\s*line|गरीबी\s*रेखा\s*से\s*नीचे)\b", clean_text, re.IGNORECASE):
            fields["card_type"] = ExtractedField("BPL", confidence=0.95, source="keyword")
            fields["is_bpl"] = ExtractedField(True, confidence=0.98, source="rule")
        elif re.search(r"\b(phh|priority\s*household|पात्र\s*गृहस्थी)\b", clean_text, re.IGNORECASE):
            fields["card_type"] = ExtractedField("PHH", confidence=0.90, source="keyword")
            fields["is_bpl"] = ExtractedField(True, confidence=0.85, source="rule")
        else:
            fields["card_type"] = ExtractedField("General/APL", confidence=0.75, source="default")
            fields["is_bpl"] = ExtractedField(False, confidence=0.75, source="default")

        # 3. Family Size
        size_match = re.search(
            r"(?:family\s*size|total\s*members|no\s*of\s*members|कुल\s*सदस्य|यूनिट)[:\s]*([0-9]{1,2})",
            clean_text,
            re.IGNORECASE,
        )
        if size_match:
            try:
                fields["family_size"] = ExtractedField(int(size_match.group(1)), confidence=0.88, source="regex")
            except ValueError:
                pass
        else:
            fields["family_size"] = ExtractedField(4, confidence=0.60, source="default", needs_confirmation=True)

        # 4. State
        indian_states = [
            "Maharashtra", "Uttar Pradesh", "Bihar", "Karnataka", "Rajasthan",
            "Madhya Pradesh", "West Bengal", "Gujarat", "Tamil Nadu", "Kerala",
            "Punjab", "Haryana", "Odisha", "Telangana", "Andhra Pradesh", "Delhi",
            "Jharkhand", "Chhattisgarh", "Uttarakhand", "Himachal Pradesh", "Assam"
        ]
        for st in indian_states:
            if re.search(rf"\b(food\s*and\s*civil\s*supplies\s*{st}|government\s*of\s*{st}|{st}\s*खाद्य)\b", clean_text, re.IGNORECASE):
                fields["state"] = ExtractedField(st, confidence=0.94, source="keyword")
                break
        if "state" not in fields:
            for st in indian_states:
                if re.search(rf"\b{st}\b", clean_text, re.IGNORECASE):
                    fields["state"] = ExtractedField(st, confidence=0.80, source="keyword")
                    break

        return ExtractionResult("ration_bpl", fields=fields, validation_errors=errors)
