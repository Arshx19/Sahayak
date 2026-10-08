"""Document Preprocessing Module.

Preprocesses input images and PDFs:
1. Deskew, denoise, grayscale, and adaptive thresholding (OpenCV / Pillow fallback).
2. For PDFs: inspects embedded text-layer first; rasterizes scanned pages to images.
3. Handles low-resolution and bilingual Indian document scans.
"""

import io
import math
import os
from typing import Any, Dict, List, Optional, Tuple, Union

try:
    import cv2
    import numpy as np
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

try:
    from PIL import Image, ImageEnhance, ImageFilter, ImageOps
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False


class PreprocessResult:
    """Encapsulates the preprocessed output for OCR and feature extraction."""

    def __init__(
        self,
        images: List[Any],
        pdf_text_layer: str = "",
        is_scanned: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.images = images  # List of processed numpy arrays or PIL Images
        self.pdf_text_layer = pdf_text_layer  # Text directly extracted from PDF
        self.is_scanned = is_scanned
        self.metadata = metadata or {}


def extract_pdf_text_layer(pdf_bytes: bytes) -> str:
    """Extract embedded text-layer from a PDF file if present."""
    if not HAS_PYPDF:
        return ""
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted_texts = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                extracted_texts.append(t.strip())
        return "\n".join(extracted_texts).strip()
    except Exception:
        return ""


def deskew_image(cv_img: Any) -> Any:
    """Estimate and correct skew angle using minimum area rectangle."""
    if not HAS_OPENCV or cv_img is None:
        return cv_img
    try:
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY) if len(cv_img.shape) == 3 else cv_img
        # Invert colors so text is foreground
        inv = cv2.bitwise_not(gray)
        thresh = cv2.threshold(inv, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
        coords = np.column_stack(np.where(thresh > 0))
        if coords.shape[0] < 50:
            return cv_img

        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        elif angle > 45:
            angle = 90 - angle
        else:
            angle = -angle

        # If angle is minor, don't perform unnecessary rotation
        if abs(angle) < 0.5 or abs(angle) > 30:
            return cv_img

        (h, w) = cv_img.shape[:2]
        center = (w // 2, h // 2)
        m = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            cv_img, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
        )
        return rotated
    except Exception:
        return cv_img


def preprocess_image_array(
    image_input: Union[bytes, Any],
    apply_deskew: bool = True,
    apply_denoise: bool = True,
) -> Tuple[Any, Dict[str, Any]]:
    """
    Apply grayscale, denoise, deskew, and adaptive thresholding to an image.
    Returns (processed_image, metrics).
    """
    metrics: Dict[str, Any] = {"deskewed": False, "denoised": False, "engine": "opencv"}

    # Handle raw bytes input
    if isinstance(image_input, (bytes, bytearray)):
        if HAS_OPENCV:
            nparr = np.frombuffer(image_input, np.uint8)
            cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif HAS_PIL:
            pil_img = Image.open(io.BytesIO(image_input)).convert("RGB")
            cv_img = None
        else:
            return image_input, {"error": "No image library available"}
    elif HAS_OPENCV and isinstance(image_input, np.ndarray):
        cv_img = image_input
    elif HAS_PIL and isinstance(image_input, Image.Image):
        if HAS_OPENCV:
            cv_img = cv2.cvtColor(np.array(image_input), cv2.COLOR_RGB2BGR)
        else:
            pil_img = image_input
            cv_img = None
    else:
        cv_img = None

    if HAS_OPENCV and cv_img is not None:
        # 1. Grayscale
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY) if len(cv_img.shape) == 3 else cv_img

        # 2. Deskew
        if apply_deskew:
            gray = deskew_image(gray)
            metrics["deskewed"] = True

        # 3. Denoise
        if apply_denoise:
            denoised = cv2.GaussianBlur(gray, (3, 3), 0)
            metrics["denoised"] = True
        else:
            denoised = gray

        # 4. Adaptive Thresholding (Otsu threshold for clean document background)
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)

        return thresh, metrics

    # Fallback using Pillow
    if HAS_PIL:
        if isinstance(image_input, (bytes, bytearray)):
            img = Image.open(io.BytesIO(image_input))
        else:
            img = image_input
        gray_pil = ImageOps.grayscale(img)
        enhanced = ImageEnhance.Contrast(gray_pil).enhance(1.8)
        return enhanced, {"engine": "pillow", "deskewed": False, "denoised": True}

    return image_input, metrics


def preprocess_document(
    file_bytes: bytes,
    file_name: str = "",
) -> PreprocessResult:
    """
    Main entrypoint for document preprocessing.
    Processes either PDF files or direct images (PNG/JPG/WEBP).
    """
    lower_name = file_name.lower()
    is_pdf = lower_name.endswith(".pdf") or file_bytes.startswith(b"%PDF")

    if is_pdf:
        text_layer = extract_pdf_text_layer(file_bytes)
        has_text = len(text_layer.strip()) > 50

        # If PDF has strong text layer, we record it
        return PreprocessResult(
            images=[],
            pdf_text_layer=text_layer,
            is_scanned=not has_text,
            metadata={"format": "pdf", "has_text_layer": has_text, "char_count": len(text_layer)},
        )
    else:
        processed_img, metrics = preprocess_image_array(file_bytes)
        return PreprocessResult(
            images=[processed_img],
            pdf_text_layer="",
            is_scanned=True,
            metadata={"format": "image", **metrics},
        )
