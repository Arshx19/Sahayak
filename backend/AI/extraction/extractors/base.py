"""Abstract Base Extractor Contract.

Defines the pluggable interface for document field extractors.
Enables transparent swapping between heuristic/regex extractors
and future ML vision models (e.g. LayoutLMv3, Donut, TrOCR)
without modifying any pipeline or controller code.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class ExtractedField:
    """Represents an extracted field with provenance, confidence, and review flags."""

    def __init__(
        self,
        value: Any,
        confidence: float = 0.85,
        source: str = "regex",
        needs_confirmation: bool = False,
    ):
        self.value = value
        self.confidence = round(float(confidence), 2)
        self.source = source
        self.needs_confirmation = needs_confirmation or (self.confidence < 0.70)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "value": self.value,
            "confidence": self.confidence,
            "source": self.source,
        }


class ExtractionResult:
    """Standardized output container for per-document extraction."""

    def __init__(
        self,
        doc_type: str,
        fields: Optional[Dict[str, ExtractedField]] = None,
        validation_errors: Optional[List[str]] = None,
    ):
        self.doc_type = doc_type
        self.fields = fields or {}
        self.validation_errors = validation_errors or []

    @property
    def needs_review(self) -> List[str]:
        """Fields flagged as low-confidence or requiring user confirmation."""
        return [
            name
            for name, field in self.fields.items()
            if field.needs_confirmation or field.confidence < 0.70
        ]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "doc_type": self.doc_type,
            "fields": {k: v.to_dict() for k, v in self.fields.items()},
            "needs_review": self.needs_review,
            "validation_errors": self.validation_errors,
        }


class BaseExtractor(ABC):
    """Abstract interface that all field extractors must implement."""

    @abstractmethod
    def extract(
        self,
        raw_text: str,
        ocr_lines: Optional[List[Any]] = None,
        qr_data: Optional[Dict[str, Any]] = None,
    ) -> ExtractionResult:
        """
        Extract structured fields from raw document text, OCR lines, and QR payload.
        Must return an ExtractionResult adhering to the standard schema.
        """
        pass
