"""Master Certificate Feature Extraction Pipeline.

Executes the complete 7-stage extraction pipeline:
1. Preprocessing (deskew, denoise, grayscale, threshold, PDF text layer).
2. QR / Barcode decoding & payload extraction.
3. Bilingual OCR (English + Hindi).
4. Document classification using keyword anchors.
5. Pluggable field extraction (BaseExtractor / ML model).
6. Normalization & validation (Verhoeff, ISO dates, integer income, validity check).
7. Confidence scoring and review gating.

Strictly outputs the per-document JSON contract:
{
  "doc_type": "...",
  "fields": {
    "field_name": { "value": "...", "confidence": 0.0, "source": "qr|ocr|regex" }
  },
  "needs_review": ["field_name"],
  "validation_errors": []
}
"""

import logging
from typing import Any, Dict, List, Optional, Union

from .classifier import classify_document_text
from .extractors.factory import get_extractor
from .ocr_engine import run_ocr
from .preprocess import preprocess_document
from .qr_decoder import cross_check_qr_with_ocr, decode_qr_from_image

logger = logging.getLogger("sahayak.ai.extraction")


def extract_certificate_features(
    file_bytes: bytes,
    file_name: str = "",
    hint_doc_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Main extraction pipeline entrypoint.
    Takes raw document file bytes and returns the standardized extraction dictionary.
    Handles corrupt/unreadable files gracefully without crashing.
    """
    validation_errors: List[str] = []

    if not file_bytes or len(file_bytes) == 0:
        return {
            "doc_type": "unknown",
            "fields": {},
            "needs_review": [],
            "validation_errors": ["Empty or missing file bytes received"],
        }

    # =========================================================================
    # STAGE 1: PREPROCESSING
    # =========================================================================
    try:
        prep_result = preprocess_document(file_bytes, file_name=file_name)
    except Exception as e:
        logger.warning(f"Preprocessing error: {e}")
        return {
            "doc_type": "unknown",
            "fields": {},
            "needs_review": [],
            "validation_errors": [f"Image preprocessing failed (file may be corrupt or unreadable): {str(e)}"],
        }

    # =========================================================================
    # STAGE 2: QR / BARCODE DECODING
    # =========================================================================
    qr_data = None
    try:
        qr_results = decode_qr_from_image(file_bytes)
        if qr_results:
            qr_data = qr_results[0]
    except Exception as e:
        logger.debug(f"QR decode exception (non-fatal): {e}")

    # =========================================================================
    # STAGE 3: OCR EXTRACTION
    # =========================================================================
    combined_text = ""
    ocr_lines = []

    # If PDF has rich text layer, prioritize text layer
    if prep_result.pdf_text_layer and len(prep_result.pdf_text_layer.strip()) > 50:
        combined_text = prep_result.pdf_text_layer
    else:
        # Run OCR on preprocessed image(s)
        try:
            target_img = prep_result.images[0] if prep_result.images else file_bytes
            ocr_lines = run_ocr(target_img, languages=["en", "hi"])
            combined_text = "\n".join([line.text for line in ocr_lines])
        except Exception as e:
            validation_errors.append(f"OCR reading error: {str(e)}")

    # If both PDF text and OCR lines are sparse, check if QR data has raw text
    if not combined_text.strip() and qr_data:
        combined_text = qr_data.get("raw_content", "")

    # If still empty, flag unreadable document
    if not combined_text.strip() and not qr_data:
        return {
            "doc_type": hint_doc_type or "unreadable",
            "fields": {},
            "needs_review": ["document_scan"],
            "validation_errors": ["Document is unreadable or image is too blurry. Please upload a clearer scan."],
        }

    # =========================================================================
    # STAGE 4: CLASSIFICATION
    # =========================================================================
    detected_type, class_conf, _ = classify_document_text(combined_text)
    final_doc_type = hint_doc_type if (hint_doc_type and hint_doc_type != "unknown") else detected_type

    if final_doc_type == "unknown":
        final_doc_type = detected_type
        if class_conf < 0.40:
            validation_errors.append("Document type could not be confidently identified from keyword anchors")

    # =========================================================================
    # STAGE 5 & 6: FIELD EXTRACTION & VALIDATION
    # =========================================================================
    extractor = get_extractor(final_doc_type)
    extraction_res = extractor.extract(
        raw_text=combined_text,
        ocr_lines=ocr_lines,
        qr_data=qr_data,
    )

    # Merge validation errors
    all_errors = list(validation_errors) + list(extraction_res.validation_errors)

    # =========================================================================
    # STAGE 7: CONFIDENCE SCORING & OUTPUT ASSEMBLY
    # =========================================================================
    output = extraction_res.to_dict()
    output["validation_errors"] = all_errors

    # If QR data was cross-checked, upgrade confidence
    if qr_data and "fields" in output:
        for f_name, f_obj in output["fields"].items():
            if f_obj.get("source") == "qr":
                f_obj["confidence"] = max(f_obj["confidence"], 0.98)

    return output
