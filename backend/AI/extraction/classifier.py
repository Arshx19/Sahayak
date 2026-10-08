"""Document Type Classifier using Bilingual Keyword Anchors.

Classifies incoming documents into canonical types:
- aadhaar
- pan
- income_certificate
- caste_certificate
- domicile_certificate
- marksheet
- disability_certificate
- ration_bpl
- birth_certificate
- land_record

Uses weighted keyword anchors across English and Hindi (Devanagari).
"""

import re
from typing import Dict, List, Optional, Tuple


# Keyword dictionaries with weights
DOCUMENT_ANCHORS: Dict[str, Dict[str, int]] = {
    "aadhaar": {
        "aadhaar": 10,
        "uidai": 10,
        "unique identification authority of india": 12,
        "government of india": 4,
        "mera aadhaar meri pehchan": 12,
        "आधार": 10,
        "भारतीय विशिष्ट पहचान प्राधिकरण": 12,
        "मेरा आधार मेरी पहचान": 12,
        "vid": 4,
        "enrollment no": 5,
        "नामांकन": 5,
    },
    "pan": {
        "income tax department": 12,
        "permanent account number": 12,
        "pan card": 10,
        "govt. of india": 4,
        "आयकर विभाग": 12,
        "स्थायी लेखा संख्या": 12,
        "father's name": 3,
        "signature": 2,
    },
    "income_certificate": {
        "income certificate": 12,
        "annual income": 8,
        "tehsildar": 6,
        "tahsildar": 6,
        "sub divisional magistrate": 6,
        "revenue department": 6,
        "आय प्रमाण पत्र": 14,
        "वार्षिक आय": 8,
        "सक्षम अधिकारी": 6,
        "तहसीलदार": 6,
        "राजस्व विभाग": 6,
        "certificate of income": 10,
    },
    "caste_certificate": {
        "caste certificate": 14,
        "community certificate": 12,
        "scheduled caste": 10,
        "scheduled tribe": 10,
        "other backward class": 10,
        "backward class": 8,
        "obc": 6,
        "sc/st": 6,
        "ews": 6,
        "जाति प्रमाण पत्र": 14,
        "अनुसूचित जाति": 10,
        "अनुसूचित जनजाति": 10,
        "अन्य पिछड़ा वर्ग": 10,
        "जाति": 6,
    },
    "domicile_certificate": {
        "domicile certificate": 14,
        "residence certificate": 12,
        "permanent resident certificate": 12,
        "ordinarily resident": 8,
        "निवास प्रमाण पत्र": 14,
        "मूल निवास प्रमाण पत्र": 14,
        "अधिवास प्रमाण पत्र": 14,
        "स्थानीय निवासी": 8,
        "domicile": 8,
    },
    "marksheet": {
        "marksheet": 12,
        "mark sheet": 12,
        "statement of marks": 12,
        "board of secondary education": 10,
        "central board of secondary education": 10,
        "cbse": 8,
        "icse": 8,
        "roll no": 6,
        "roll number": 6,
        "grand total": 6,
        "percentage": 5,
        "division": 5,
        "अंक पत्र": 12,
        "माध्यमिक शिक्षा बोर्ड": 10,
        "रोल नंबर": 6,
        "प्राप्तांक": 6,
    },
    "disability_certificate": {
        "disability certificate": 14,
        "certificate for person with disability": 14,
        "udid": 10,
        "percentage of disability": 10,
        "locomotor": 8,
        "visual impairment": 8,
        "divyang": 8,
        "दिव्यांगता प्रमाण पत्र": 14,
        "विकलांगता प्रमाण पत्र": 14,
        "दिव्यांग": 8,
    },
    "ration_bpl": {
        "ration card": 12,
        "bpl": 8,
        "below poverty line": 10,
        "antyodaya": 10,
        "aay": 8,
        "food & civil supplies": 8,
        "fair price shop": 6,
        "राशन कार्ड": 14,
        "गरीबी रेखा": 10,
        "अन्त्योदय": 10,
        "खाद्य एवं रसद विभाग": 10,
    },
    "birth_certificate": {
        "birth certificate": 14,
        "certificate of birth": 14,
        "registration of births": 10,
        "municipal corporation": 6,
        "date of birth": 6,
        "जन्म प्रमाण पत्र": 14,
        "जन्म एवं मृत्यु": 10,
        "नगर निगम": 6,
    },
    "land_record": {
        "land record": 12,
        "khatauni": 12,
        "khasra": 12,
        "record of rights": 12,
        "jamabandi": 10,
        "agricultural land": 8,
        "भूलेख": 12,
        "खतौनी": 12,
        "खसरा": 12,
        "जमाबंदी": 10,
    },
}


def classify_document_text(text: str) -> Tuple[str, float, Dict[str, int]]:
    """
    Classify document type using weighted keyword matching.
    Returns (predicted_doc_type, confidence_score, all_scores).
    """
    if not text:
        return "unknown", 0.0, {}

    normalized = text.lower()
    scores: Dict[str, int] = {}

    for doc_type, anchors in DOCUMENT_ANCHORS.items():
        total_score = 0
        for anchor, weight in anchors.items():
            # Whole word or substring match
            pattern = re.escape(anchor)
            matches = len(re.findall(pattern, normalized))
            if matches > 0:
                total_score += weight * min(matches, 3)
        scores[doc_type] = total_score

    best_type = max(scores, key=lambda k: scores[k])
    best_score = scores[best_type]

    if best_score < 8:
        return "unknown", 0.2, scores

    # Normalized confidence calculation
    second_best = sorted(scores.values(), reverse=True)[1]
    confidence = min(0.99, 0.65 + (best_score - second_best) * 0.03 + min(best_score, 40) * 0.005)

    return best_type, round(confidence, 2), scores
