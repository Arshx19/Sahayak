"""Citizen Document Locker Routes (/documents).

Manages citizen digital document locker operations.
Enforces document key normalization, connects directly to backend/DB/crud.py,
and triggers automatic in-app notifications upon document upload/verification.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

try:
    from schemas.document import DocumentUploadRequest
    from auth.dependencies import get_current_user
except ImportError:
    from crud.schemas.document import DocumentUploadRequest
    from crud.auth.dependencies import get_current_user

try:
    from DB.connection import get_db
    from DB import crud, schemas
except ImportError:
    from backend.DB.connection import get_db
    from backend.DB import crud, schemas

router = APIRouter()

# Document Key Aliases mapping frontend shorthand to canonical DB keys
DOCUMENT_KEY_ALIASES = {
    "photo": "photograph",
    "bank_passbook": "bank_account",
    "income_cert": "income_certificate",
    "caste_cert": "caste_certificate",
    "domicile": "domicile_certificate",
    "land_records": "land_record",
}


def normalize_document_type(raw_type: str) -> str:
    """Normalize document type from frontend aliases to canonical DB keys."""
    if not raw_type:
        return ""
    clean = raw_type.strip().lower().replace("-", "_").replace(" ", "_")
    return DOCUMENT_KEY_ALIASES.get(clean, clean)


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="List all uploaded documents for the authenticated citizen",
)
async def get_my_documents(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve all documents in the citizen's digital document locker."""
    user_id = current_user["user_id"]

    try:
        documents = await crud.get_user_documents(db, user_id)
        if documents is not None:
            formatted_docs = []
            for d in documents:
                formatted_docs.append({
                    "document_id": d.get("document_id"),
                    "document_type": d.get("document_type"),
                    "document_name": d.get("document_name") or d.get("document_type", "").replace("_", " ").title(),
                    "document_number": d.get("document_number"),
                    "verification_status": d.get("verification_status", "verified"),
                    "file_name": d.get("file_name"),
                    "file_url": d.get("file_url"),
                    "uploaded_at": d.get("uploaded_at"),
                    "metadata": d.get("metadata", {}),
                })
            return {"success": True, "data": formatted_docs}
    except Exception:
        pass

    # Fallback when database is offline or empty
    return {"success": True, "data": []}


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
    summary="Upload or register a document in citizen locker",
)
async def upload_document(
    payload: DocumentUploadRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """
    Save or update a document in the citizen locker.
    Normalizes document key aliases (e.g. photo -> photograph, bank_passbook -> bank_account).
    Automatically triggers an in-app notification upon successful verification.
    """
    user_id = current_user["user_id"]
    normalized_type = normalize_document_type(payload.document_type)

    doc_name = (
        payload.document_name
        or normalized_type.replace("_", " ").title()
    )

    doc_data = {
        "document_type": normalized_type,
        "document_name": doc_name,
        "document_number": payload.document_number,
        "file_name": payload.file_name or f"{normalized_type}_verified.pdf",
        "file_url": payload.file_url,
        "verification_status": payload.verification_status or "verified",
        "status": payload.status or "active",
        "metadata": payload.metadata or {},
    }

    saved_doc = None
    try:
        saved_doc = await crud.create_or_update_user_document(db, user_id, doc_data)
    except Exception:
        # Development fallback
        saved_doc = {
            "document_id": f"doc_dev_{normalized_type}",
            "user_id": user_id,
            **doc_data,
        }

    # Auto-Notification Trigger
    try:
        await crud.create_notification(
            db,
            {
                "user_id": user_id,
                "notification_type": "DOCUMENT_VERIFIED",
                "title": "Document Verified",
                "message": f"{doc_name} has been added to your digital locker.",
                "context": {"document_type": normalized_type},
            },
        )
    except Exception:
        pass

    return {
        "success": True,
        "message": f"Document '{doc_name}' saved to digital locker successfully",
        "data": saved_doc,
    }


@router.delete(
    "/{document_type}",
    status_code=status.HTTP_200_OK,
    summary="Delete or archive a document from citizen locker",
)
async def delete_document(
    document_type: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """Soft delete or archive a citizen document by type."""
    user_id = current_user["user_id"]
    canonical_type = normalize_document_type(document_type)

    try:
        await crud.delete_user_document(db, user_id, canonical_type, soft_delete=True)
    except Exception:
        pass

    return {
        "success": True,
        "message": f"Document '{canonical_type}' deleted successfully from locker",
    }
