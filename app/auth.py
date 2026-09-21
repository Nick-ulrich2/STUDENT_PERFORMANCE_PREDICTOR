import os
from typing import Annotated, Any, TypedDict

import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


class CurrentUser(TypedDict):
    id: str
    role: str
    jwt: str
    claims: dict[str, Any]


bearer_scheme = HTTPBearer(auto_error=False)
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
jwk_client = PyJWKClient(f"{SUPABASE_URL or 'https://example.com'}/auth/v1/.well-known/jwks.json")


def get_jwk_client() -> PyJWKClient:
    return jwk_client


def _extract_role(claims: dict[str, Any]) -> str | None:
    for source in (
        claims.get("app_metadata"),
        claims.get("user_metadata"),
        {"role": claims.get("user_role")},
    ):
        if not isinstance(source, dict):
            continue
        role = source.get("role")
        if role in {"student", "admin"}:
            return role
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

    if not SUPABASE_URL:
        raise _unauthorized("SUPABASE_URL is not configured. Add it to your .env file before starting the backend.")

    try:
        signing_key = get_jwk_client().get_signing_key_from_jwt(credentials.credentials)
        claims = jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["ES256"],
            audience=os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated"),
        )
    except jwt.PyJWTError as e:
        print("DEBUG_JWT_ERROR:", repr(e))
        raise _unauthorized("Invalid Supabase access token.")

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
