"""User management for the admin panel, via Supabase's GoTrue Admin API.

Deliberately separate from repository.py: everything in repository.py acts
as the calling user (a per-request client authenticated with their own JWT,
governed by RLS). Listing every user and changing a role are operations no
JWT-scoped client can ever be allowed to do, by design — they require the
service_role key, which must never leave the backend. This module is the
one place that key is used, and only behind require_admin (see main.py).
"""

import logging
import os

import httpx

logger = logging.getLogger("app.admin_users")

VALID_ROLES = ("student", "admin")


class AdminUsersError(Exception):
    """Raised when a Supabase Admin API call fails (config, network, or upstream error)."""


def _base_url() -> str:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    if not url:
        raise AdminUsersError("SUPABASE_URL manquant.")
    return url


def _service_role_headers() -> dict[str, str]:
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not key:
        raise AdminUsersError(
            "SUPABASE_SERVICE_ROLE_KEY manquant : requis pour la gestion des utilisateurs."
        )
    return {"apikey": key, "Authorization": f"Bearer {key}"}


def _to_summary(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user.get("email"),
        "role": (user.get("app_metadata") or {}).get("role", "student"),
        "created_at": user.get("created_at"),
        "last_sign_in_at": user.get("last_sign_in_at"),
        "email_confirmed_at": user.get("email_confirmed_at"),
    }


def list_users(*, page: int = 1, per_page: int = 200) -> list[dict]:
    try:
        response = httpx.get(
            f"{_base_url()}/auth/v1/admin/users",
            headers=_service_role_headers(),
            params={"page": page, "per_page": per_page},
            timeout=15.0,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.exception("Supabase a refuse la liste des utilisateurs")
        raise AdminUsersError(
            f"Le service Supabase a refuse la requete (HTTP {exc.response.status_code})."
        ) from exc
    except httpx.HTTPError as exc:
        logger.exception("Supabase Admin API injoignable")
        raise AdminUsersError("Service Supabase momentanement indisponible.") from exc

    body = response.json()
    users = body.get("users", body if isinstance(body, list) else [])
    return [_to_summary(u) for u in users]


def set_user_role(*, user_id: str, role: str) -> dict:
    if role not in VALID_ROLES:
        raise AdminUsersError(f"Role invalide : {role!r}.")
    try:
        response = httpx.put(
            f"{_base_url()}/auth/v1/admin/users/{user_id}",
            headers={**_service_role_headers(), "Content-Type": "application/json"},
            json={"app_metadata": {"role": role}},
            timeout=15.0,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.exception("Supabase a refuse la mise a jour du role")
        raise AdminUsersError(
            f"Le service Supabase a refuse la mise a jour (HTTP {exc.response.status_code})."
        ) from exc
    except httpx.HTTPError as exc:
        logger.exception("Supabase Admin API injoignable")
        raise AdminUsersError("Service Supabase momentanement indisponible.") from exc

    return _to_summary(response.json())
