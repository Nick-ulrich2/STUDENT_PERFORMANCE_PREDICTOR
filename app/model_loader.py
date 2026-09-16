import joblib
from pathlib import Path

DEFAULT_MODEL_PATH = Path(__file__).parent / "model" / "ridge_model_final.joblib"

def load_pipeline(path=None):
    """Charge le pipeline joblib depuis le disque. Lève une erreur claire si absent."""
    model_path = Path(path) if path else DEFAULT_MODEL_PATH
    if not model_path.exists():
        raise FileNotFoundError(f"Modèle introuvable à {model_path}. Vérifie le chemin.")
    return joblib.load(model_path)