import joblib
import sklearn
from pathlib import Path

EXPECTED_SKLEARN_VERSION = sklearn.__version__
DEFAULT_MODEL_PATH = Path(__file__).parent / "model" / "ridge_model_final.joblib"


def load_pipeline(path: Path = DEFAULT_MODEL_PATH):
    pipeline = joblib.load(path)
    if sklearn.__version__ != EXPECTED_SKLEARN_VERSION:
        # log un warning, ne pas forcément bloquer — à toi de décider
        print(f"⚠️ Attention: sklearn {sklearn.__version__} installé, modèle entraîné avec {EXPECTED_SKLEARN_VERSION}.")

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