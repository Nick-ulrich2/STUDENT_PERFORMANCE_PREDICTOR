import logging
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

from app.schemas import StudentInput, PredictionOutput
from app.model_loader import load_pipeline
from app.auth import CurrentUser, require_admin, require_user

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

# Development origins only. Production origins must be configured explicitly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8501", "http://localhost:3000"],
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


def _get_supabase_client(jwt: str):
    from app.db import get_supabase_client

    return get_supabase_client(jwt)


@app.post("/predict", response_model=PredictionOutput)
def predict(data: StudentInput):
    logger.info(f"Requête reçue : {data.model_dump()}")
    return _build_prediction(data)


@app.post("/predictions")
def create_prediction(data: StudentInput, current_user: CurrentUser = Depends(require_user)):
    prediction = _build_prediction(data)
    payload = {
        **data.model_dump(),
        "user_id": current_user["id"],
        "predicted_score": prediction.predicted_score,
        "model_name": prediction.model_name,
    }
    try:
        response = _get_supabase_client(current_user["jwt"]).table("predictions").insert(payload).execute()
    except Exception as exc:
        logger.exception("Échec de l'enregistrement de la prédiction")
        raise HTTPException(
            status_code=500,
            detail="Échec de l'enregistrement de la prédiction.",
        ) from exc

    if not response.data:
        raise HTTPException(status_code=500, detail="La prédiction n'a pas été enregistrée.")
    return response.data[0]


@app.get("/predictions/me")
def list_my_predictions(current_user: CurrentUser = Depends(require_user)):
    try:
        response = _get_supabase_client(current_user["jwt"]).table("predictions").select("*").execute()
    except Exception as exc:
        logger.exception("Échec de lecture de l'historique étudiant")
        raise HTTPException(
            status_code=500,
            detail="Échec de lecture de l'historique étudiant.",
        ) from exc
    return response.data


@app.get("/admin/predictions")
def list_all_predictions(current_user: CurrentUser = Depends(require_admin)):
    try:
        response = _get_supabase_client(current_user["jwt"]).table("predictions").select("*").execute()
    except Exception as exc:
        logger.exception("Échec de lecture de la supervision administrateur")
        raise HTTPException(
            status_code=500,
            detail="Échec de lecture de la supervision administrateur.",
        ) from exc
    return response.data