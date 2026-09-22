import logging
import os
import time
from typing import Annotated, Any, TypedDict

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger("app.auth")


class CurrentUser(TypedDict):
    id: str
    role: str
    jwt: str
    claims: dict[str, Any]


bearer_scheme = HTTPBearer(auto_error=False)
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
JWKS_CACHE_TTL_SECONDS = 60 * 60 * 4
_JWKS_CACHE: dict[str, Any] = {"expires_at": 0.0, "keys": {}}


def _extract_role(claims: dict[str, Any]) -> str | None:
    # SECURITY: only app_metadata is a trusted source of the application role.
    # user_metadata (and its underlying raw_user_meta_data) is client-controlled:
    # anyone calling Supabase Auth signUp directly can set
    # options.data.role to whatever they want. A prior version of this function
    # also accepted user_metadata.role and a bare user_role claim as fallbacks,
    # which let any signup grant itself the "admin" role — see
    # supabase/migrations/0005_remove_insecure_role_sync_trigger.sql for
    # the matching database-side fix. Never reintroduce a fallback to
    # user_metadata or a client-settable claim here.
    app_metadata = claims.get("app_metadata")
    if not isinstance(app_metadata, dict):
        return None
    role = app_metadata.get("role")
    if role in {"student", "admin"}:
        return role
    return None


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _get_jwks_url() -> str:
    if not SUPABASE_URL:
        raise _unauthorized("SUPABASE_URL manquant — vérifier que .env est chargé avant uvicorn")
    return f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"


def _get_signing_key_from_jwks(token: str) -> str:
    header = jwt.get_unverified_header(token)
    key_id = header.get("kid")
    if not isinstance(key_id, str) or not key_id:
        raise _unauthorized("Token missing key id (kid) in JWT header.")

    now = time.time()
    cache = _JWKS_CACHE
    if now >= cache["expires_at"] or key_id not in cache["keys"]:
        client = jwt.PyJWKClient(_get_jwks_url())
        signing_key = client.get_signing_key_from_jwt(token)
        cache["keys"][key_id] = signing_key.key
        cache["expires_at"] = now + JWKS_CACHE_TTL_SECONDS

    signing_key = cache["keys"].get(key_id)
    if signing_key is None:
        raise _unauthorized("No public JWKS key found for the provided token.")
    return signing_key


def _decode_token(credentials: HTTPAuthorizationCredentials | None) -> CurrentUser:
    if credentials is None:
        raise _unauthorized("Bearer token is required.")

    token = credentials.credentials
    try:
        signing_key = _get_signing_key_from_jwks(token)
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["ES256"],
            audience=os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated"),
        )
    except jwt.PyJWTError as exc:
        logger.warning("JWT verification failed: %r", exc)
        raise _unauthorized("Invalid Supabase access token.")

    user_id = claims.get("sub")
    role = _extract_role(claims)
    if not isinstance(user_id, str) or role is None:
        raise _unauthorized("Token must contain a user id and a supported application role.")

    return {
        "id": user_id,
        "role": role,
        "jwt": token,
        "claims": claims,
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
