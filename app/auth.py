import os
from typing import Annotated, Any, TypedDict

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


class CurrentUser(TypedDict):
    id: str
    role: str
    jwt: str
    claims: dict[str, Any]


bearer_scheme = HTTPBearer(auto_error=False)


def _extract_role(claims: dict[str, Any]) -> str | None:
    app_metadata = claims.get("app_metadata")
    if isinstance(app_metadata, dict) and app_metadata.get("role") in {"student", "admin"}:
        return app_metadata["role"]
    if claims.get("user_role") in {"student", "admin"}:
        return claims["user_role"]
    return None


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _decode_token(credentials: HTTPAuthorizationCredentials | None) -> CurrentUser:
    if credentials is None:
        raise _unauthorized("Bearer token is required.")

    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SUPABASE_JWT_SECRET is not configured.",
        )

    try:
        claims = jwt.decode(
            credentials.credentials,
            secret,
            algorithms=["HS256"],
            audience=os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated"),
        )
    except jwt.PyJWTError as exc:
        raise _unauthorized("Invalid Supabase access token.") from exc

    user_id = claims.get("sub")
    role = _extract_role(claims)
    if not isinstance(user_id, str) or role is None:
        raise _unauthorized("Token must contain a user id and a supported application role.")

    return {
        "id": user_id, 
        "role": role,
        "jwt": credentials.credentials, 
        "claims": claims
    }


def require_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> CurrentUser:
    return _decode_token(credentials)


def require_admin(current_user: Annotated[CurrentUser, Depends(require_user)]) -> CurrentUser:
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required.",
        )
    return current_user
