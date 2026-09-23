import logging
import os
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

from app.schemas import (
    ActivityCorrection,
    ActivityRecord,
    ActivityStart,
    AggregatedFeatures,
    AttendanceMark,
    PredictionOutput,
    ProfileAttributes,
    RecommendationOutput,
    RecommendationRequest,
    RoleUpdateRequest,
    StudentInput,
    UserSummary,
)
from app.model_loader import load_pipeline
from app.auth import CurrentUser, require_admin, require_user
from app import repository
from app.llm import RecommendationError, generate_recommendation
from app import admin_users
from app.admin_users import AdminUsersError

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger("app.main")

FEATURE_ORDER = [
    "Attendance", "Hours_Studied", "Previous_Scores",
    "Tutoring_Sessions", "Access_to_Resources", "Parental_Involvement",
]

THRESHOLDS = {
    "Attendance": 70,
    "Hours_Studied": 10,
    "Previous_Scores": 60,
    "Tutoring_Sessions": 2,
}

pipeline_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Démarrage de l'API : chargement du pipeline")
    try:
        pipeline_state["pipeline"] = load_pipeline()
        logger.info("Pipeline chargé avec succès")
    except FileNotFoundError as e:
        logger.error(f"Échec du chargement du modèle : {e}")
        raise RuntimeError(f"Échec du chargement du modèle au démarrage : {e}")
    yield
    pipeline_state.clear()

app = FastAPI(lifespan=lifespan)

# Local development + explicit production hosts. The canonical local frontend URL is
# 127.0.0.1:3001 and the backend must stay on 127.0.0.1:8000.
allowed_origins = [
    "http://127.0.0.1:3001",
    "http://localhost:3001",
    "http://127.0.0.1:3002",
    "http://localhost:3002",
    "http://127.0.0.1:3003",
    "http://localhost:3003",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]
production_frontend = os.getenv("FRONTEND_ORIGIN")
if production_frontend:
    allowed_origins.append(production_frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    pipeline = pipeline_state.get("pipeline")
    if pipeline is None:
        raise HTTPException(
            status_code=503,
            detail="Le modèle n'est pas encore chargé. Le serveur démarre peut-être encore."
        )
    model = pipeline.named_steps["model"]
    return {"model_name": type(model).__name__, "features": FEATURE_ORDER}


@app.get("/me")
def get_my_role(current_user: CurrentUser = Depends(require_user)):
    return {"role": current_user["role"]}


def _extract_sorted_coefficients(model, feature_names, top_n: int | None = None):
    coefs = np.asarray(model.coef_, dtype=float).ravel()
    if len(coefs) != len(feature_names):
        raise ValueError("Nombre de coefficients incompatible avec les features.")
    pairs = list(zip(feature_names, [round(float(c), 4) for c in coefs]))
    pairs.sort(key=lambda x: abs(x[1]), reverse=True)
    if top_n is not None:
        pairs = pairs[:top_n]
    return dict(pairs)


def _compute_below_threshold(data: StudentInput):
    return [name for name, limit in THRESHOLDS.items() if getattr(data, name) < limit]


def _build_prediction(data: StudentInput) -> PredictionOutput:
    try:
        pipeline = pipeline_state["pipeline"]
        row = pd.DataFrame(
            [[getattr(data, col) for col in FEATURE_ORDER]],
            columns=FEATURE_ORDER,
        )
    except Exception as exc:
        logger.exception("Échec de construction des données de prédiction")
        raise HTTPException(
            status_code=500,
            detail="Échec de construction des données de prédiction.",
        ) from exc

    try:
        raw_prediction = pipeline.predict(row)[0]
    except Exception as exc:
        logger.exception("Échec interne de la prédiction")
        raise HTTPException(
            status_code=500,
            detail="Échec interne de la prédiction.",
        ) from exc

    predicted_score = float(np.clip(raw_prediction, 0, 100))
    model = pipeline.named_steps["model"]
    return PredictionOutput(
        model_name=type(model).__name__,
        predicted_score=round(predicted_score, 2),
        top_features=_extract_sorted_coefficients(model, FEATURE_ORDER, top_n=5),
        below_threshold=_compute_below_threshold(data),
    )

# /predict is the user-facing calculation endpoint: a DB outage must not hide
# a valid ML result, so persistence is best-effort and failures are logged.
@app.post("/predict", response_model=PredictionOutput)
def predict(data: StudentInput, current_user: CurrentUser = Depends(require_user)):
    logger.info(f"Requête reçue : {data.model_dump()}")
    prediction = _build_prediction(data)
    try:
        repository.create_prediction(
            jwt=current_user["jwt"],
            user_id=current_user["id"],
            data=data,
            model_name=prediction.model_name,
            predicted_score=prediction.predicted_score,
            below_threshold=prediction.below_threshold,
        )
    except Exception:
        # The prediction response remains available when persistence is unavailable.
        logger.exception("Échec de persistance ; la prédiction calculée est retournée")
    return prediction

# /predictions is the explicit persistence endpoint: its contract is to confirm
# durable storage, so a DB failure is reported as HTTP 500 instead of success.
@app.post("/predictions")
def create_prediction(data: StudentInput, current_user: CurrentUser = Depends(require_user)):
    prediction = _build_prediction(data)
    try:
        return repository.create_prediction(
            jwt=current_user["jwt"],
            user_id=current_user["id"],
            data=data,
            model_name=prediction.model_name,
            predicted_score=prediction.predicted_score,
            below_threshold=prediction.below_threshold,
        )
    except Exception as exc:
        logger.exception("Échec de l'enregistrement de la prédiction")
        raise HTTPException(
            status_code=500,
            detail="Échec de l'enregistrement de la prédiction.",
        ) from exc

@app.get("/predictions/me")
def list_my_predictions(current_user: CurrentUser = Depends(require_user)):
    try:
        return repository.get_predictions_for_user(
            jwt=current_user["jwt"],
            user_id=current_user["id"],
        )
    except Exception as exc:
        logger.exception("Échec de lecture de l'historique étudiant")
        raise HTTPException(
            status_code=500,
            detail="Échec de lecture de l'historique étudiant.",
        ) from exc
@app.get("/admin/predictions")
def list_all_predictions(current_user: CurrentUser = Depends(require_admin)):
    try:
        return repository.get_all_predictions(jwt=current_user["jwt"])
    except Exception as exc:
        logger.exception("Échec de lecture de la supervision administrateur")
        raise HTTPException(
            status_code=500,
            detail="Échec de lecture de la supervision administrateur.",
        ) from exc


# --- Admin panel: user management (Supabase Admin API, service_role only,
# never exposed to the frontend) ---

@app.get("/admin/users", response_model=list[UserSummary])
def list_users(current_user: CurrentUser = Depends(require_admin)):
    try:
        return admin_users.list_users()
    except AdminUsersError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.put("/admin/users/{user_id}/role", response_model=UserSummary)
def update_user_role(
    user_id: str, data: RoleUpdateRequest, current_user: CurrentUser = Depends(require_admin)
):
    # An admin can promote or demote any other account, but never their own —
    # this is the one guardrail that prevents an admin from locking
    # themselves (or, worse, every admin) out by mis-clicking.
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=400, detail="Vous ne pouvez pas modifier votre propre rôle."
        )
    try:
        return admin_users.set_user_role(user_id=user_id, role=data.role)
    except AdminUsersError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


# --- Habit tracker: raw activity logs (start/stop/correction cycle) ---

@app.post("/activities/start", response_model=ActivityRecord)
def start_activity(data: ActivityStart, current_user: CurrentUser = Depends(require_user)):
    try:
        return repository.start_activity(
            jwt=current_user["jwt"],
            user_id=current_user["id"],
            activity_type=data.activity_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Échec du démarrage de l'activité")
        raise HTTPException(
            status_code=500,
            detail="Échec du démarrage de l'activité.",
        ) from exc


@app.post("/activities/{activity_id}/stop", response_model=ActivityRecord)
def stop_activity(activity_id: int, current_user: CurrentUser = Depends(require_user)):
    try:
        return repository.stop_activity(
            jwt=current_user["jwt"],
            user_id=current_user["id"],
            activity_id=activity_id,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Échec de l'arrêt de l'activité")
        raise HTTPException(
            status_code=500,
            detail="Échec de l'arrêt de l'activité.",
        ) from exc


@app.post("/activities/attendance", response_model=ActivityRecord)
def mark_attendance(data: AttendanceMark, current_user: CurrentUser = Depends(require_user)):
    try:
        return repository.mark_attendance(
            jwt=current_user["jwt"],
            user_id=current_user["id"],
            status=data.status,
            log_date=data.log_date,
        )
    except Exception as exc:
        logger.exception("Échec de l'enregistrement de l'assiduité")
        raise HTTPException(
            status_code=500,
            detail="Échec de l'enregistrement de l'assiduité.",
        ) from exc


@app.post("/activities/{activity_id}/correct", response_model=ActivityRecord)
def correct_activity(
    activity_id: int,
    data: ActivityCorrection,
    current_user: CurrentUser = Depends(require_user),
):
    try:
        return repository.correct_activity(
            jwt=current_user["jwt"],
            user_id=current_user["id"],
            activity_id=activity_id,
            note=data.note,
            started_at=data.started_at,
            ended_at=data.ended_at,
            status=data.status,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Échec de la correction de l'activité")
        raise HTTPException(
            status_code=500,
            detail="Échec de la correction de l'activité.",
        ) from exc


@app.get("/activities/me", response_model=list[ActivityRecord])
def list_my_activities(current_user: CurrentUser = Depends(require_user)):
    try:
        return repository.list_activities(
            jwt=current_user["jwt"],
            user_id=current_user["id"],
        )
    except Exception as exc:
        logger.exception("Échec de lecture des activités")
        raise HTTPException(
            status_code=500,
            detail="Échec de lecture des activités.",
        ) from exc


# --- Habit tracker: slowly-changing profile attributes (not "activities") ---

@app.get("/me/profile-attributes")
def get_my_profile_attributes(current_user: CurrentUser = Depends(require_user)):
    try:
        return repository.get_profile_attributes(
            jwt=current_user["jwt"],
            user_id=current_user["id"],
        )
    except Exception as exc:
        logger.exception("Échec de lecture des attributs du profil")
        raise HTTPException(
            status_code=500,
            detail="Échec de lecture des attributs du profil.",
        ) from exc


@app.put("/me/profile-attributes")
def update_my_profile_attributes(data: ProfileAttributes, current_user: CurrentUser = Depends(require_user)):
    try:
        return repository.upsert_profile_attributes(
            jwt=current_user["jwt"],
            user_id=current_user["id"],
            previous_scores=data.Previous_Scores,
            access_to_resources=data.Access_to_Resources,
            parental_involvement=data.Parental_Involvement,
        )
    except RuntimeError as exc:
        # Raised by the repository when the profile row doesn't exist yet
        # (e.g. the 0006 migration hasn't run on this database).
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Échec de la mise à jour des attributs du profil")
        raise HTTPException(
            status_code=500,
            detail="Échec de la mise à jour des attributs du profil.",
        ) from exc


# --- Habit tracker: aggregation layer (raw logs -> the six ML features) ---

@app.get("/me/features", response_model=AggregatedFeatures)
def get_my_features(window_days: int = 7, current_user: CurrentUser = Depends(require_user)):
    try:
        return repository.compute_aggregated_features(
            jwt=current_user["jwt"],
            user_id=current_user["id"],
            window_days=window_days,
        )
    except ValueError as exc:
        # Missing attendance marks or incomplete profile attributes: the
        # aggregation is well-defined but not yet possible for this user.
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Échec du calcul des features agrégées")
        raise HTTPException(
            status_code=500,
            detail="Échec du calcul des features agrégées.",
        ) from exc


# /predict/from-activity mirrors /predict exactly (same best-effort persistence
# contract) ; only the input source changes: aggregated activity_logs instead
# of a manually typed form.
@app.post("/predict/from-activity", response_model=PredictionOutput)
def predict_from_activity(window_days: int = 7, current_user: CurrentUser = Depends(require_user)):
    try:
        features = repository.compute_aggregated_features(
            jwt=current_user["jwt"],
            user_id=current_user["id"],
            window_days=window_days,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Échec du calcul des features agrégées")
        raise HTTPException(
            status_code=500,
            detail="Échec du calcul des features agrégées.",
        ) from exc

    data = StudentInput(
        Attendance=features["Attendance"],
        Hours_Studied=features["Hours_Studied"],
        Previous_Scores=features["Previous_Scores"],
        Tutoring_Sessions=features["Tutoring_Sessions"],
        Access_to_Resources=features["Access_to_Resources"],
        Parental_Involvement=features["Parental_Involvement"],
    )
    prediction = _build_prediction(data)
    try:
        repository.create_prediction(
            jwt=current_user["jwt"],
            user_id=current_user["id"],
            data=data,
            model_name=prediction.model_name,
            predicted_score=prediction.predicted_score,
            below_threshold=prediction.below_threshold,
        )
    except Exception:
        logger.exception("Échec de persistance ; la prédiction calculée est retournée")
    return prediction


# --- LLM recommendations (roadmap Phase 6) ---
# Strict separation from the ML layer: the client sends back the PredictionOutput
# it already received from /predict or /predict/from-activity, and this route only
# turns it into a short explanation. The LLM never sees raw student data and never
# influences predicted_score — ML predicts, LLM explains, never the reverse.
@app.post("/predict/recommendation", response_model=RecommendationOutput)
def get_recommendation(
    data: RecommendationRequest, current_user: CurrentUser = Depends(require_user)
):
    try:
        text = generate_recommendation(
            predicted_score=data.predicted_score,
            top_features=data.top_features,
            below_threshold=data.below_threshold,
        )
    except RecommendationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return RecommendationOutput(recommendation=text)