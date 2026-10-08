"""QR & Barcode Decoding and Cross-Checking Module.

Decodes QR codes and 2D barcodes from government certificates (Aadhaar, PAN, e-District):
1. Detects and decodes QR codes using OpenCV QRCodeDetector or PyZbar.
2. Parses legacy XML Aadhaar QR format (<PrintLetterBarcodeData ... />).
3. Parses modern JSON / delimited / URL-encoded certificate QR payloads.
4. Provides cross-checking utilities comparing QR data with OCR results.
"""

import io
import json
import re
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional, Tuple

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    from pyzbar import pyzbar
    HAS_PYZBAR = True
except ImportError:
    HAS_PYZBAR = False

from .validators import mask_aadhaar, parse_iso_date


def _parse_aadhaar_xml_qr(xml_text: str) -> Optional[Dict[str, Any]]:
    """Parse legacy Aadhaar XML QR content (<PrintLetterBarcodeData ... />)."""
    if "PrintLetterBarcodeData" not in xml_text:
        return None
    try:
        root = ET.fromstring(xml_text)
        attrs = root.attrib
        name = attrs.get("name", "")
        dob = attrs.get("dob") or attrs.get("yob", "")
        gender = attrs.get("gender", "")
        if gender.upper() in ("M", "MALE"):
            gender = "Male"
        elif gender.upper() in ("F", "FEMALE"):
            gender = "Female"

        raw_uid = attrs.get("uid", "")
        masked_uid = mask_aadhaar(raw_uid) if raw_uid else None

        district = attrs.get("dist") or attrs.get("subdist")
        state = attrs.get("state")
        pincode = attrs.get("pc")

        return {
            "name": name,
            "dob": parse_iso_date(dob) if dob else None,
            "gender": gender,
            "aadhaar_last_4": masked_uid[-4:] if masked_uid else None,
            "aadhaar_masked": masked_uid,
            "state": state,
            "district": district,
            "pincode": pincode,
            "raw_source": "aadhaar_xml_qr",
        }
    except Exception:
        return None


def _parse_generic_qr_payload(raw_data: str) -> Dict[str, Any]:
    """Parse JSON or structured text in QR codes (e-PAN, State Portals)."""
    # 1. Try Aadhaar XML
    aadhaar_res = _parse_aadhaar_xml_qr(raw_data)
    if aadhaar_res:
        return {"parsed_type": "aadhaar", "fields": aadhaar_res}

    # 2. Try JSON payload
    try:
        data = json.loads(raw_data)
        if isinstance(data, dict):
            return {"parsed_type": "json_qr", "fields": data}
    except Exception:
        pass

    # 3. PAN regex match in raw QR
    pan_match = re.search(r"\b([A-Z]{5}\d{4}[A-Z])\b", raw_data)
    pan_number = pan_match.group(1) if pan_match else None

    # 4. State e-District Certificate Application / Certificate Number
    cert_match = re.search(r"(?:cert|app|ref|no)[_:=/](\w{8,25})", raw_data, re.IGNORECASE)
    cert_no = cert_match.group(1) if cert_match else None

    fields: Dict[str, Any] = {"raw_text": raw_data}
    if pan_number:
        fields["pan_number"] = pan_number
    if cert_no:
        fields["certificate_number"] = cert_no

    return {"parsed_type": "generic_qr", "fields": fields}


def decode_qr_from_image(image_input: Any) -> List[Dict[str, Any]]:
    """
    Detect and decode all QR codes present in the image.
    Uses PyZbar if available, falling back to OpenCV QRCodeDetector.
    """
    results: List[Dict[str, Any]] = []

    # 1. Try PyZbar
    if HAS_PYZBAR:
        try:
            if isinstance(image_input, (bytes, bytearray)):
                pil_img = Image.open(io.BytesIO(image_input))
            elif HAS_PIL and isinstance(image_input, Image.Image):
                pil_img = image_input
            elif HAS_CV2 and isinstance(image_input, np.ndarray):
                pil_img = Image.fromarray(image_input)
            else:
                pil_img = None

            if pil_img:
                decoded = pyzbar.decode(pil_img)
                for item in decoded:
                    raw_str = item.data.decode("utf-8", errors="ignore")
                    if raw_str:
                        parsed = _parse_generic_qr_payload(raw_str)
                        results.append({
                            "type": item.type,
                            "raw_content": raw_str,
                            "parsed": parsed,
                            "source": "pyzbar",
                        })
                if results:
                    return results
        except Exception:
            pass

    # 2. Try OpenCV QRCodeDetector
    if HAS_CV2:
        try:
            if isinstance(image_input, (bytes, bytearray)):
                nparr = np.frombuffer(image_input, np.uint8)
                cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            elif isinstance(image_input, np.ndarray):
                cv_img = image_input
            elif HAS_PIL and isinstance(image_input, Image.Image):
                cv_img = cv2.cvtColor(np.array(image_input), cv2.COLOR_RGB2BGR)
            else:
                cv_img = None

            if cv_img is not None:
                detector = cv2.QRCodeDetector()
                data, bbox, _ = detector.detectAndDecode(cv_img)
                if data:
                    parsed = _parse_generic_qr_payload(data)
                    results.append({
                        "type": "QRCODE",
                        "raw_content": data,
                        "parsed": parsed,
                        "source": "opencv",
                    })
        except Exception:
            pass

    return results


def cross_check_qr_with_ocr(
    qr_fields: Dict[str, Any],
    ocr_fields: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Cross-checks QR data against OCR fields.
    If QR exists, treats QR as primary source (confidence 0.98),
    and validates OCR consistency.
    """
    merged: Dict[str, Any] = {}
    mismatches: List[str] = []

    all_keys = set(qr_fields.keys()).union(set(ocr_fields.keys()))

    for key in all_keys:
        qr_val = qr_fields.get(key)
        ocr_val = ocr_fields.get(key)

        if qr_val is not None and ocr_val is not None:
            # Check string similarity / equality
            qr_s = str(qr_val).strip().lower()
            ocr_s = str(ocr_val).strip().lower()
            if qr_s == ocr_s or qr_s in ocr_s or ocr_s in qr_s:
                merged[key] = {
                    "value": qr_val,
                    "confidence": 0.99,
                    "source": "qr_cross_verified",
                }
            else:
                mismatches.append(key)
                # Keep QR as primary source since QR code is tamper-evident
                merged[key] = {
                    "value": qr_val,
                    "confidence": 0.95,
                    "source": "qr_primary_mismatch",
                    "ocr_alternative": ocr_val,
                }
        elif qr_val is not None:
            merged[key] = {
                "value": qr_val,
                "confidence": 0.95,
                "source": "qr",
            }
        else:
            merged[key] = {
                "value": ocr_val,
                "confidence": 0.85,
                "source": "ocr",
            }

    return {
        "fields": merged,
        "mismatches": mismatches,
    }
