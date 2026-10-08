"""Marksheet / Educational Certificate Feature Extractor.

Extracts:
- name
- roll_no
- marks_percentage (float, e.g. 78.5)
- board (CBSE / ICSE / State Board)
- year (passing year integer)
- qualification_level (10th / 12th / Graduation)
"""

import re
from typing import Any, Dict, List, Optional
from ..validators import fix_numeric_ocr_errors
from .base import BaseExtractor, ExtractedField, ExtractionResult


class MarksheetExtractor(BaseExtractor):
    """Rule-based extractor for Academic Marksheets and Transcripts."""

    def extract(
        self,
        raw_text: str,
        ocr_lines: Optional[List[Any]] = None,
        qr_data: Optional[Dict[str, Any]] = None,
    ) -> ExtractionResult:
        fields: Dict[str, ExtractedField] = {}
        errors: List[str] = []

        clean_text = raw_text or ""

        # 1. Roll Number
        roll_match = re.search(
            r"(?:roll\s*no|roll\s*number|रोल\s*नं|क्रमांक)[:\s]+([A-Z0-9]{4,15})",
            clean_text,
            re.IGNORECASE,
        )
        if roll_match:
            fields["roll_no"] = ExtractedField(roll_match.group(1).strip(), confidence=0.92, source="regex")

        # 2. Extract Name
        name_match = re.search(
            r"(?:candidate['’]?s\s*name|student['’]?s\s*name|name\s*of\s*student|नाम)[:\s]+([A-Za-z\s]{3,35})",
            clean_text,
            re.IGNORECASE,
        )
        if name_match:
            fields["name"] = ExtractedField(name_match.group(1).strip(), confidence=0.88, source="regex")

        # 3. Extract Percentage or CGPA
        perc_match = re.search(
            r"(?:percentage|percent|प्रतिशत|marks\s*obtained|aggregate)[:\s]*([0-9OIlSB]{2}(?:\.[0-9OIlSB]{1,2})?)\s*%",
            clean_text,
            re.IGNORECASE,
        )
        if not perc_match:
            perc_match = re.search(r"\b([4-9][0-9]\.[0-9]{1,2})\s*%\b", clean_text)

        if perc_match:
            raw_perc = fix_numeric_ocr_errors(perc_match.group(1).strip())
            try:
                p_val = float(raw_perc)
                if 0.0 <= p_val <= 100.0:
                    fields["marks_percentage"] = ExtractedField(p_val, confidence=0.92, source="regex")
            except ValueError:
                pass

        # If not percentage, search for total marks e.g. "450/500" or "450 out of 500"
        if "marks_percentage" not in fields:
            marks_frac = re.search(r"(\d{2,3})\s*(?:\/|\s*out\s*of\s*)\s*(\d{2,3})", clean_text)
            if marks_frac:
                obtained, total = float(marks_frac.group(1)), float(marks_frac.group(2))
                if 0 < obtained <= total and total >= 100:
                    calc_perc = round((obtained / total) * 100.0, 2)
                    fields["marks_percentage"] = ExtractedField(calc_perc, confidence=0.85, source="calculation")

        # 4. Extract Education Board
        board_anchors = [
            ("Central Board of Secondary Education (CBSE)", ["cbse", "central board of secondary education"]),
            ("Council for the Indian School Certificate Examinations (ICSE/ISC)", ["icse", "isc", "council for the indian school"]),
            ("Maharashtra State Board", ["maharashtra state board", "msbshse"]),
            ("Uttar Pradesh State Board (UP Board)", ["madhyamik shiksha parishad", "up board"]),
            ("Bihar School Examination Board (BSEB)", ["bihar school examination board", "bseb"]),
            ("National Institute of Open Schooling (NIOS)", ["nios", "national institute of open schooling"]),
        ]
        for board_label, aliases in board_anchors:
            if any(re.search(rf"\b{re.escape(al)}\b", clean_text, re.IGNORECASE) for al in aliases):
                fields["board"] = ExtractedField(board_label, confidence=0.92, source="keyword")
                break
        if "board" not in fields:
            fields["board"] = ExtractedField("Recognized State/Central Board", confidence=0.70, source="default")

        # 5. Extract Passing Year
        year_match = re.search(r"(?:year\s*of\s*passing|examination|session)[:\s]*([12][09][0-9]{2})", clean_text, re.IGNORECASE)
        if not year_match:
            year_match = re.search(r"\b(20[0-2][0-9])\b", clean_text)
        if year_match:
            try:
                fields["year"] = ExtractedField(int(year_match.group(1)), confidence=0.88, source="regex")
            except ValueError:
                pass

        # 6. Qualification Level (12th / 10th / Diploma / Degree)
        if re.search(r"\b(senior\s*secondary|class\s*12|12th|intermediate|इण्टरमीडिएट)\b", clean_text, re.IGNORECASE):
            fields["qualification_level"] = ExtractedField("12th", confidence=0.94, source="keyword")
        elif re.search(r"\b(secondary|class\s*10|10th|high\s*school|matriculation|मैट्रिक)\b", clean_text, re.IGNORECASE):
            fields["qualification_level"] = ExtractedField("10th", confidence=0.94, source="keyword")
        elif re.search(r"\b(diploma|polytechnic)\b", clean_text, re.IGNORECASE):
            fields["qualification_level"] = ExtractedField("Diploma", confidence=0.92, source="keyword")
        elif re.search(r"\b(bachelor|graduation|degree|b\.tech|b\.sc|b\.a|b\.com)\b", clean_text, re.IGNORECASE):
            fields["qualification_level"] = ExtractedField("Graduation", confidence=0.90, source="keyword")
        else:
            fields["qualification_level"] = ExtractedField("Secondary", confidence=0.70, source="default")

        return ExtractionResult("marksheet", fields=fields, validation_errors=errors)
