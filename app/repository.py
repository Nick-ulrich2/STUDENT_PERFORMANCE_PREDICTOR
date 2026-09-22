from datetime import date, datetime, timedelta, timezone
from typing import Any

from app.db import get_supabase_client
from app.schemas import StudentInput


def _parse_ts(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _get_active_model_version_id(client: Any, model_name: str) -> int:
    response = (
        client.table("model_versions")
        .select("id")
        .eq("name", model_name)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if not response.data:
        raise RuntimeError(f"Aucune version active du modele {model_name!r} n'est disponible.")
    return response.data[0]["id"]


def create_prediction(
    *,
    jwt: str,
    user_id: str,
    data: StudentInput,
    model_name: str,
    predicted_score: float,
    below_threshold: list[str],
) -> dict[str, Any]:
    client = get_supabase_client(jwt)
    model_version_id = _get_active_model_version_id(client, model_name)
    payload = {
        "user_id": user_id,
        "model_version_id": model_version_id,
        "attendance": data.Attendance,
        "hours_studied": data.Hours_Studied,
        "previous_scores": data.Previous_Scores,
        "tutoring_sessions": data.Tutoring_Sessions,
        "access_to_resources": data.Access_to_Resources,
        "parental_involvement": data.Parental_Involvement,
        "predicted_score": predicted_score,
        "below_threshold": below_threshold,
    }
    response = client.table("predictions").insert(payload).execute()
    if not response.data:
        raise RuntimeError("La prediction n'a pas ete enregistree.")
    return response.data[0]


def get_predictions_for_user(*, jwt: str, user_id: str) -> list[dict[str, Any]]:
    response = (
        get_supabase_client(jwt)
        .table("predictions")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    return response.data


def get_all_predictions(*, jwt: str) -> list[dict[str, Any]]:
    response = get_supabase_client(jwt).table("predictions").select("*").execute()
    return response.data


# --- Habit tracker: raw activity logs ---

def start_activity(*, jwt: str, user_id: str, activity_type: str) -> dict[str, Any]:
    client = get_supabase_client(jwt)
    existing = (
        client.table("activity_logs")
        .select("id")
        .eq("user_id", user_id)
        .eq("activity_type", activity_type)
        .eq("status", "in_progress")
        .limit(1)
        .execute()
    )
    if existing.data:
        raise ValueError(f"Une activite '{activity_type}' est deja en cours.")
    payload = {
        "user_id": user_id,
        "activity_type": activity_type,
        "status": "in_progress",
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    response = client.table("activity_logs").insert(payload).execute()
    if not response.data:
        raise RuntimeError("L'activite n'a pas pu etre demarree.")
    return response.data[0]


def stop_activity(*, jwt: str, user_id: str, activity_id: int) -> dict[str, Any]:
    client = get_supabase_client(jwt)
    current = (
        client.table("activity_logs")
        .select("id, status")
        .eq("id", activity_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not current.data:
        raise LookupError("Activite introuvable.")
    if current.data[0]["status"] != "in_progress":
        raise ValueError("Cette activite n'est pas en cours.")
    response = (
        client.table("activity_logs")
        .update({"status": "completed", "ended_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", activity_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not response.data:
        raise RuntimeError("L'activite n'a pas pu etre arretee.")
    return response.data[0]


def mark_attendance(*, jwt: str, user_id: str, status: str, log_date: date) -> dict[str, Any]:
    client = get_supabase_client(jwt)
    day_start = datetime.combine(log_date, datetime.min.time(), tzinfo=timezone.utc)
    day_end = day_start + timedelta(days=1)
    existing = (
        client.table("activity_logs")
        .select("id")
        .eq("user_id", user_id)
        .eq("activity_type", "attendance")
        .neq("status", "corrected")
        .gte("started_at", day_start.isoformat())
        .lt("started_at", day_end.isoformat())
        .limit(1)
        .execute()
    )
    payload = {
        "user_id": user_id,
        "activity_type": "attendance",
        "status": status,
        "started_at": day_start.isoformat(),
    }
    if existing.data:
        superseded_id = existing.data[0]["id"]
        client.table("activity_logs").update({"status": "corrected"}).eq("id", superseded_id).execute()
        payload["corrected_from"] = superseded_id
    response = client.table("activity_logs").insert(payload).execute()
    if not response.data:
        raise RuntimeError("L'assiduite n'a pas pu etre enregistree.")
    return response.data[0]


def correct_activity(
    *,
    jwt: str,
    user_id: str,
    activity_id: int,
    note: str,
    started_at: datetime | None = None,
    ended_at: datetime | None = None,
    status: str | None = None,
) -> dict[str, Any]:
    client = get_supabase_client(jwt)
    original = (
        client.table("activity_logs")
        .select("*")
        .eq("id", activity_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not original.data:
        raise LookupError("Activite introuvable.")
    row = original.data[0]

    client.table("activity_logs").update({"status": "corrected"}).eq("id", activity_id).execute()

    new_status = status if status else ("completed" if row["activity_type"] != "attendance" else row["status"])
    payload = {
        "user_id": user_id,
        "activity_type": row["activity_type"],
        "status": new_status,
        "started_at": started_at.isoformat() if started_at else row["started_at"],
        "ended_at": ended_at.isoformat() if ended_at else row.get("ended_at"),
        "corrected_from": activity_id,
        "note": note,
    }
    response = client.table("activity_logs").insert(payload).execute()
    if not response.data:
        raise RuntimeError("La correction n'a pas pu etre enregistree.")
    return response.data[0]


def list_activities(*, jwt: str, user_id: str, since: datetime | None = None) -> list[dict[str, Any]]:
    query = get_supabase_client(jwt).table("activity_logs").select("*").eq("user_id", user_id)
    if since is not None:
        query = query.gte("started_at", since.isoformat())
    response = query.order("started_at", desc=True).execute()
    return response.data


def get_profile_attributes(*, jwt: str, user_id: str) -> dict[str, Any]:
    response = (
        get_supabase_client(jwt)
        .table("profiles")
        .select("previous_scores, access_to_resources, parental_involvement")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else {}


def upsert_profile_attributes(
    *, jwt: str, user_id: str, previous_scores: float, access_to_resources: str, parental_involvement: str
) -> dict[str, Any]:
    payload = {
        "id": user_id,
        "previous_scores": previous_scores,
        "access_to_resources": access_to_resources,
        "parental_involvement": parental_involvement,
    }
    response = get_supabase_client(jwt).table("profiles").update(payload).eq("id", user_id).execute()
    if not response.data:
        raise RuntimeError(
            "Profil introuvable pour cet utilisateur ; verifie que la migration "
            "0006_activity_logs_and_profile_attributes.sql a bien tourne."
        )
    return response.data[0]


def compute_aggregated_features(*, jwt: str, user_id: str, window_days: int = 7) -> dict[str, Any]:
    since = datetime.now(timezone.utc) - timedelta(days=window_days)
    logs = [
        log for log in list_activities(jwt=jwt, user_id=user_id, since=since)
        if log["status"] != "corrected"
    ]

    study_minutes = 0.0
    tutoring_sessions = 0
    present_days = 0
    marked_days = 0
    for log in logs:
        if log["activity_type"] == "study_session" and log["status"] == "completed" and log.get("ended_at"):
            study_minutes += (_parse_ts(log["ended_at"]) - _parse_ts(log["started_at"])).total_seconds() / 60
        elif log["activity_type"] == "tutoring_session" and log["status"] == "completed":
            tutoring_sessions += 1
        elif log["activity_type"] == "attendance":
            marked_days += 1
            if log["status"] == "present":
                present_days += 1

    if marked_days == 0:
        raise ValueError(
            "Aucune assiduite enregistree sur cette periode ; marque au moins un jour "
            "de presence/absence avant de lancer une prediction."
        )

    attributes = get_profile_attributes(jwt=jwt, user_id=user_id)
    missing = [
        key for key in ("previous_scores", "access_to_resources", "parental_involvement")
        if attributes.get(key) is None
    ]
    if missing:
        raise ValueError(
            "Complete ton profil avant de lancer une prediction (champs manquants : "
            + ", ".join(missing) + ")."
        )

    return {
        "Attendance": round(min(100.0, max(0.0, present_days / marked_days * 100)), 2),
        "Hours_Studied": round(min(45.0, max(0.0, study_minutes / 60)), 2),
        "Previous_Scores": attributes["previous_scores"],
        "Tutoring_Sessions": min(8, tutoring_sessions),
        "Access_to_Resources": attributes["access_to_resources"],
        "Parental_Involvement": attributes["parental_involvement"],
        "window_days": window_days,
        "days_logged": marked_days,
    }