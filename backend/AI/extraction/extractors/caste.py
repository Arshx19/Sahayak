"""Caste / Category Certificate Feature Extractor.

Extracts:
- name
- caste (sub-caste / community name)
- category (SC, ST, OBC, EWS, General)
- issuing_authority (SDM / Tehsildar / Executive Magistrate)
- issue_date (ISO format)
- state_of_issue (Crucial for state-specific caste list matching)
- certificate_number
"""

import re
from typing import Any, Dict, List, Optional
from ..validators import parse_iso_date
from .base import BaseExtractor, ExtractedField, ExtractionResult


class CasteCertificateExtractor(BaseExtractor):
    """Rule-based extractor for Caste/Community Certificates."""

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
            r"(?:certificate\s*no|application\s*no|प्रमाण\s*पत्र\s*क्रमांक|क्रमांक)[:\s]+([A-Z0-9\/\-]{6,25})",
            clean_text,
            re.IGNORECASE,
        )
        if cert_match:
            fields["certificate_number"] = ExtractedField(cert_match.group(1).strip(), confidence=0.92, source="regex")

        # 2. Extract Caste Category (SC / ST / OBC / EWS / General)
        # Check specific category anchors
        if re.search(r"\b(scheduled\s*caste|अनुसूचित\s*जाति)\b", clean_text, re.IGNORECASE) or re.search(r"\bSC\b", clean_text):
            fields["category"] = ExtractedField("SC", confidence=0.95, source="keyword")
        elif re.search(r"\b(scheduled\s*tribe|अनुसूचित\s*जनजाति)\b", clean_text, re.IGNORECASE) or re.search(r"\bST\b", clean_text):
            fields["category"] = ExtractedField("ST", confidence=0.95, source="keyword")
        elif re.search(r"\b(other\s*backward\s*class(?:es)?|अन्य\s*पिछड़ा\s*वर्ग)\b", clean_text, re.IGNORECASE) or re.search(r"\bOBC\b", clean_text):
            fields["category"] = ExtractedField("OBC", confidence=0.95, source="keyword")
        elif re.search(r"\b(economically\s*weaker\s*section|आर्थिक\s*रूप\s*से\s*कमजोर\s*वर्ग)\b", clean_text, re.IGNORECASE) or re.search(r"\bEWS\b", clean_text):
            fields["category"] = ExtractedField("EWS", confidence=0.95, source="keyword")
        elif re.search(r"\b(general|सामान्य)\b", clean_text, re.IGNORECASE):
            fields["category"] = ExtractedField("General", confidence=0.85, source="keyword")
        else:
            fields["category"] = ExtractedField(None, confidence=0.0, source="missing", needs_confirmation=True)
            errors.append("Caste Certificate: Caste category (SC/ST/OBC/EWS) could not be identified")

        # 3. Extract Specific Caste / Community Name
        caste_match = re.search(
            r"(?:belongs\s*to\s*the|जाति\s*से\s*संबंधित\s*है|caste\s*is|जाति)[:\s]+([A-Za-z\u0900-\u097F\s]{3,30})(?:\s+community|\s+caste|\s+वर्ग)?",
            clean_text,
            re.IGNORECASE,
        )
        if caste_match:
            cand_caste = caste_match.group(1).strip()
            # Clean generic words
            cand_caste = re.sub(r"\b(community|caste|जाति|वर्ग|category)\b", "", cand_caste, flags=re.IGNORECASE).strip()
            if cand_caste:
                fields["caste"] = ExtractedField(cand_caste, confidence=0.82, source="regex")

        # 4. Extract Name
        name_match = re.search(
            r"(?:certified\s*that|प्रमाणित\s*किया\s*जाता\s*है\s*कि|shri|smt|श्री|श्रीमती)\s+([A-Za-z\s]{3,35})(?:\s+son|\s+daughter|\s+s/o|\s+d/o)",
            clean_text,
            re.IGNORECASE,
        )
        if name_match:
            fields["name"] = ExtractedField(name_match.group(1).strip(), confidence=0.85, source="regex")

        # 5. Extract State of Issue (Essential for state-specific caste rules)
        indian_states = [
            "Maharashtra", "Uttar Pradesh", "Bihar", "Karnataka", "Rajasthan",
            "Madhya Pradesh", "West Bengal", "Gujarat", "Tamil Nadu", "Kerala",
            "Punjab", "Haryana", "Odisha", "Telangana", "Andhra Pradesh", "Delhi",
            "Jharkhand", "Chhattisgarh", "Uttarakhand", "Himachal Pradesh", "Assam"
        ]
        for st in indian_states:
            if re.search(rf"\b(government\s*of\s*{st}|{st}\s*शासन|state\s*of\s*{st}|{st}\s*state)\b", clean_text, re.IGNORECASE):
                fields["state_of_issue"] = ExtractedField(st, confidence=0.92, source="keyword")
                break
        if "state_of_issue" not in fields:
            # Check standalone state name
            for st in indian_states:
                if re.search(rf"\b{st}\b", clean_text, re.IGNORECASE):
                    fields["state_of_issue"] = ExtractedField(st, confidence=0.80, source="keyword")
                    break

        # 6. Extract Issuing Authority
        authority_anchors = [
            ("Sub-Divisional Officer (SDO/SDM)", ["sub divisional officer", "sub divisional magistrate", "sub-divisional magistrate", "sdo", "sdm", "उप जिलाधिकारी"]),
            ("Tehsildar", ["tehsildar", "तहसीलदार"]),
            ("District Magistrate / Deputy Commissioner", ["district magistrate", "deputy commissioner", "जिलाधिकारी"]),
            ("Revenue Divisional Officer", ["revenue divisional officer", "rdo"]),
        ]
        for auth_label, aliases in authority_anchors:
            if any(re.search(rf"\b{re.escape(alias)}\b", clean_text, re.IGNORECASE) for alias in aliases):
                fields["issuing_authority"] = ExtractedField(auth_label, confidence=0.90, source="keyword")
                break
        if "issuing_authority" not in fields:
            fields["issuing_authority"] = ExtractedField("Competent Authority", confidence=0.70, source="default")

        # 7. Extract Issue Date
        issue_match = re.search(r"\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b", clean_text)
        if issue_match:
            issue_date_iso = parse_iso_date(issue_match.group(1))
            if issue_date_iso:
                fields["issue_date"] = ExtractedField(issue_date_iso, confidence=0.88, source="regex")

        return ExtractionResult("caste_certificate", fields=fields, validation_errors=errors)
