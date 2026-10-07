"""FastAPI authentication and authorization dependencies for SAHAYAK."""

from typing import Any, Callable, Dict
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .jwt import decode_access_token

security = HTTPBearer(auto_error=False)

# Valid roles supported by the SAHAYAK platform
VALID_ROLES = {"citizen", "officer", "admin"}


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    """Validate bearer token and extract current user information from payload.

    Returns:
        dict: Containing 'user_id' and 'role'.

    Raises:
        HTTPException: 401 Unauthorized if token is missing, invalid, or expired.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "error": "Authentication token missing or invalid"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "error": "Invalid or expired token"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id")
    role = payload.get("role")

    if not user_id or not role or role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "error": "Invalid token credentials"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "user_id": str(user_id),
        "role": str(role),
    }


def require_role(*allowed_roles: str) -> Callable[..., Any]:
    """Dependency factory enforcing Role-Based Access Control (RBAC).

    Usage:
        @router.post("/schemes", dependencies=[Depends(require_role("admin"))])
    """
    async def role_checker(
        current_user: Dict[str, Any] = Depends(get_current_user),
    ) -> Dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "error": f"Access forbidden: requires one of {allowed_roles} roles",
                },
            )
        return current_user

    return role_checker


def check_ownership(resource_owner_id: str, current_user: Dict[str, Any]) -> None:
    """Enforce object-level authorization (ownership check).

    Citizens can only access their own resources.
    Officers and Admins can access citizen resources within their purview.

    Raises:
        HTTPException: 403 Forbidden if citizen does not own the resource.
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role")

    if role == "citizen" and user_id != resource_owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": "Forbidden: You are not authorized to access this resource",
            },
        )
