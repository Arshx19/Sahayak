"""Extractors package."""

from .base import BaseExtractor, ExtractedField, ExtractionResult
from .factory import get_extractor, register_extractor
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

__all__ = [
    "BaseExtractor",
    "ExtractedField",
    "ExtractionResult",
    "get_extractor",
    "register_extractor",
    "AadhaarExtractor",
    "PANExtractor",
    "IncomeCertificateExtractor",
    "CasteCertificateExtractor",
    "DomicileExtractor",
    "MarksheetExtractor",
    "DisabilityCertificateExtractor",
    "RationBplExtractor",
    "BirthCertificateExtractor",
    "LandRecordExtractor",
]
