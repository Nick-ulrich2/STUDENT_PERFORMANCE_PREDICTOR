from typing import Any

from app.db import get_supabase_client
from app.schemas import StudentInput


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