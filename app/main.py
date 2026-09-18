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


@app.post("/predict", response_model=PredictionOutput)
def predict(data: StudentInput):
    logger.info(f"Requête reçue : {data.model_dump()}")
    try:
        pipeline = pipeline_state["pipeline"]
        row = pd.DataFrame(
            [[getattr(data, col) for col in FEATURE_ORDER]],
            columns=FEATURE_ORDER,
        )
    except Exception as e:
        logger.exception("Échec de construction des données de prédiction")
        raise HTTPException(
            status_code=500,
            detail=f"Échec de construction des données de prédiction : {e}",
        )

    try:
        raw_prediction = pipeline.predict(row)[0]
    except Exception as e:
        logger.error(f"Échec interne de la prédiction : {e}")
        raise HTTPException(status_code=500, detail=f"Échec de la prédiction : {e}")

    predicted_score = float(np.clip(raw_prediction, 0, 100))

    model = pipeline.named_steps["model"]
    top_features = _extract_sorted_coefficients(model, FEATURE_ORDER, top_n=5)
    below_threshold = _compute_below_threshold(data)

    return PredictionOutput(
        model_name=type(model).__name__,
        predicted_score=round(predicted_score, 2),
        top_features=top_features,
        below_threshold=below_threshold,
    )


@app.post("/predictions", status_code=501)
def create_prediction(data: StudentInput, current_user: CurrentUser = Depends(require_user)):
    """Reserve the authenticated prediction-persistence contract for Supabase."""
    raise HTTPException(
        status_code=501,
        detail="Prediction persistence is not connected to Supabase yet.",
    )


@app.get("/predictions/me", status_code=501)
def list_my_predictions(current_user: CurrentUser = Depends(require_user)):
    """Reserve the student-isolated history contract for Supabase."""
    raise HTTPException(
        status_code=501,
        detail="Prediction history is not connected to Supabase yet.",
    )


@app.get("/admin/predictions", status_code=501)
def list_all_predictions(current_user: CurrentUser = Depends(require_admin)):
    """Reserve the admin global read contract with backend role enforcement."""
    raise HTTPException(
        status_code=501,
        detail="Admin prediction supervision is not connected to Supabase yet.",
    )