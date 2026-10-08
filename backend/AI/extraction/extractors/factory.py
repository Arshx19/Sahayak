"""Extractor Registry and Factory.

Allows seamless registration and retrieval of document extractors.
Enables swapping between rule-based/regex extractors and ML vision models
(e.g., LayoutLMv3, Donut) without modifying calling pipelines.
"""

from typing import Dict, Type
from .base import BaseExtractor
from .aadhaar import AadhaarExtractor
from .pan import PANExtractor
from .income import IncomeCertificateExtractor
from .caste import CasteCertificateExtractor
from .domicile import DomicileExtractor
from .marksheet import MarksheetExtractor
from .disability import DisabilityCertificateExtractor
from .ration_bpl import RationBplExtractor
from .birth_cert import BirthCertificateExtractor
from .land_record import LandRecordExtractor


# Registry mapping canonical document types to extractor classes
_EXTRACTOR_REGISTRY: Dict[str, Type[BaseExtractor]] = {
    "aadhaar": AadhaarExtractor,
    "pan": PANExtractor,
    "income_certificate": IncomeCertificateExtractor,
    "caste_certificate": CasteCertificateExtractor,
    "domicile_certificate": DomicileExtractor,
    "marksheet": MarksheetExtractor,
    "disability_certificate": DisabilityCertificateExtractor,
    "ration_bpl": RationBplExtractor,
    "birth_certificate": BirthCertificateExtractor,
    "land_record": LandRecordExtractor,
}


def register_extractor(doc_type: str, extractor_cls: Type[BaseExtractor]) -> None:
    """Register or override an extractor class for a document type (e.g. for ML models)."""
    _EXTRACTOR_REGISTRY[doc_type.lower()] = extractor_cls


def get_extractor(doc_type: str) -> BaseExtractor:
    """Instantiate and return the appropriate extractor for the given document type."""
    clean_type = doc_type.strip().lower()
    extractor_cls = _EXTRACTOR_REGISTRY.get(clean_type)
    if not extractor_cls:
        # Default fallback to Aadhaar or base
        extractor_cls = AadhaarExtractor
    return extractor_cls()
