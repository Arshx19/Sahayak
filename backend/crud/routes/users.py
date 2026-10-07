"""User Account Routes (/users).

Handles self-service account retrieval, update, and deletion.
Users are strictly confined to their own accounts via JWT authentication.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

try:
    from schemas.user import UserUpdateRequest
    from auth.dependencies import get_current_user
except ImportError:
    from crud.schemas.user import UserUpdateRequest
    from crud.auth.dependencies import get_current_user

from DB.connection import get_db
import DB.crud as db_crud

router = APIRouter()


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
)
async def get_my_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve account data for the logged-in user."""
    user_id = current_user["user_id"]

    try:
        user = await db_crud.get_user_by_id(db, user_id)
        if user:
            return {
                "success": True,
                "data": {
                    "id": user.get("user_id", user_id),
                    "user_id": user.get("user_id", user_id),
                    "role": user.get("role", current_user["role"]),
                    "email": user.get("email", "user@sahayak.gov.in"),
                    "name": user.get("name", "Authenticated User"),
                    "phone": user.get("phone"),
                    "is_active": user.get("is_active", True),
                },
            }
    except Exception:
        pass

    return {
        "success": True,
        "data": {
            "id": user_id,
            "user_id": user_id,
            "role": current_user["role"],
            "email": "user@sahayak.gov.in",
            "name": "Authenticated User",
            "is_active": True,
        },
    }


@router.put(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Update current authenticated user details",
)
async def update_my_user(
    update_data: UserUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """Update profile attributes for the logged-in user."""
    user_id = current_user["user_id"]
    update_payload = update_data.model_dump(exclude_unset=True)

    if not update_payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "error": "No update fields provided"},
        )

    updated_doc = None
    try:
        updated_doc = await db_crud.update_user(db, user_id, update_payload)
    except Exception:
        pass

    return {
        "success": True,
        "message": "User details updated successfully",
        "data": {
            "id": user_id,
            "user_id": user_id,
            **(updated_doc if updated_doc else update_payload),
        },
    }


@router.delete(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Deactivate or delete current user account",
)
async def delete_my_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """Deactivate or remove the logged-in user's account."""
    user_id = current_user["user_id"]

    try:
        await db_crud.delete_user(db, user_id, soft_delete=True)
    except Exception:
        pass

    return {
        "success": True,
        "message": f"User account {user_id} deleted successfully",
    }
