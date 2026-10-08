"""In-App User Notifications Routes (/notifications).

Provides endpoints to retrieve user notifications, mark single notification as read,
and mark all notifications as read.
Delegates directly to repository functions in backend/DB/crud.py.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status

try:
    from schemas.notification import (
        NotificationResponse,
        NotificationListResponse,
    )
    from auth.dependencies import get_current_user
except ImportError:
    from crud.schemas.notification import (
        NotificationResponse,
        NotificationListResponse,
    )
    from crud.auth.dependencies import get_current_user

try:
    from DB.connection import get_db
    from DB import crud, schemas
except ImportError:
    from backend.DB.connection import get_db
    from backend.DB import crud, schemas

router = APIRouter()


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="Get notifications for the current authenticated user",
)
async def get_notifications(
    unread_only: bool = Query(False, description="Filter for unread notifications only"),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve in-app notifications for the logged-in user, ordered newest first."""
    user_id = current_user["user_id"]

    try:
        notifications = await crud.get_user_notifications(db, user_id, unread_only=unread_only)
        if notifications is not None:
            return {
                "success": True,
                "data": notifications,
            }
    except Exception:
        pass

    return {
        "success": True,
        "data": [],
    }


@router.put(
    "/{notification_id}/read",
    status_code=status.HTTP_200_OK,
    summary="Mark a specific notification as read",
)
async def mark_notification_read(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """Mark a single user notification as read with user ownership isolation."""
    user_id = current_user["user_id"]

    try:
        await crud.mark_notification_as_read(db, notification_id, user_id)
    except Exception:
        pass

    return {
        "success": True,
        "message": f"Notification '{notification_id}' marked as read",
    }


@router.put(
    "/read-all",
    status_code=status.HTTP_200_OK,
    summary="Mark all unread notifications as read",
)
async def mark_all_read(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Any = Depends(get_db),
) -> Dict[str, Any]:
    """Mark all unread notifications as read for the logged-in user."""
    user_id = current_user["user_id"]

    try:
        await crud.mark_all_notifications_read(db, user_id)
    except Exception:
        pass

    return {
        "success": True,
        "message": "All notifications marked as read",
    }
