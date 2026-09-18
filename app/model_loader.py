import joblib
import logging
import sklearn
from pathlib import Path

EXPECTED_SKLEARN_VERSION = "1.9.1"
DEFAULT_MODEL_PATH = Path(__file__).parent / "model" / "ridge_model_final.joblib"


def load_pipeline(path: Path = DEFAULT_MODEL_PATH, expected_version: str = EXPECTED_SKLEARN_VERSION):
    try:
        pipeline = joblib.load(path)
    except FileNotFoundError as exc:
        raise FileNotFoundError(f"Model artifact not found: {path}") from exc
    except Exception as exc:
        raise RuntimeError(f"Unable to load model artifact {path}: {exc}") from exc

    if sklearn.__version__ != expected_version:
        logging.warning(
            "scikit-learn version mismatch: runtime=%s expected=%s",
            sklearn.__version__,
            expected_version,
        )

    if not hasattr(pipeline, "predict"):
        raise TypeError(
            f"L'objet chargé depuis {path} n'est pas un pipeline scikit-learn valide "
            f"(pas de méthode .predict)."
        )

    if not hasattr(pipeline, "named_steps") or "model" not in pipeline.named_steps:
        raise ValueError(
            "Le pipeline chargé ne contient pas d'étape nommée 'model'. "
            "Vérifie la sérialisation du pipeline dans le notebook."
        )

    return pipeline