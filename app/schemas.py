from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal

class StudentInput(BaseModel):

    model_config = ConfigDict(extra="forbid")

    Attendance: float = Field(
        ..., ge=0, le=100,
        description="Taux d'assiduité de l'étudiant, en pourcentage (0-100)."
    )
    Hours_Studied: float = Field(
        ..., ge=0, le=45,
        description="Nombre d'heures d'étude hebdomadaires. "
                    "Borné à la plage observée dans les données d'entraînement "
                    "pour éviter une extrapolation non fiable du modèle."
    )
    Previous_Scores: float = Field(
        ..., ge=0, le=100,
        description="Score obtenu lors de l'évaluation précédente (0-100)."
    )
    Tutoring_Sessions: int = Field(
        ..., ge=0, le=8,
        description="Nombre de séances de tutorat, entier dans la plage observée (0-8)."
    )
    Access_to_Resources: Literal["Low", "Medium", "High"] = Field(
    ..., description="Niveau d'accès de l'étudiant aux ressources pédagogiques "
                    "(manuels, internet, matériel). Catégorie utilisée telle "
                    "qu'observée dans les données d'entraînement."
    )
    Parental_Involvement: Literal["Low", "Medium", "High"] = Field(
    ..., description="Niveau d'implication des parents dans le suivi scolaire "
                    "de l'étudiant, tel que déclaré dans le dataset source."
    )


class PredictionOutput(BaseModel):

    model_name: str = Field(..., description="Nom du modèle ayant produit la prédiction.")
    predicted_score: float = Field(
        ..., ge=0, le=100,
        description="Score prédit, borné à l'échelle réelle des notes (0-100)."
    )
    top_features: dict = Field(
        ..., description="Coefficients du modèle par variable, triés par importance absolue."
    )
    below_threshold: list[str] = Field(
        ..., description="Liste des variables de l'étudiant en dessous des seuils recommandés."
    )


class RecommendationRequest(BaseModel):
    """Input for /predict/recommendation: the client sends back exactly what
    /predict or /predict/from-activity just returned. The LLM never sees raw
    student data, only the already-computed prediction — it explains, it
    does not predict."""

    model_config = ConfigDict(extra="forbid")

    predicted_score: float = Field(..., ge=0, le=100)
    top_features: dict[str, float]
    below_threshold: list[str]


class RecommendationOutput(BaseModel):
    recommendation: str = Field(
        ..., description="Explication et piste d'action générées par le LLM à partir de la prédiction."
    )


# --- Habit tracker: raw activity logs, aggregated into the schemas above ---

class ActivityStart(BaseModel):
    model_config = ConfigDict(extra="forbid")

    activity_type: Literal["study_session", "tutoring_session"] = Field(
        ...,
        description="Type d'activité à démarrer. L'assiduité se marque via "
                    "/activities/attendance (pas de start/stop pour un statut binaire).",
    )


class ActivityRecord(BaseModel):
    id: int
    activity_type: str
    status: str
    started_at: datetime
    ended_at: datetime | None = None
    corrected_from: int | None = None
    note: str | None = None


class AttendanceMark(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["present", "absent"]
    log_date: date = Field(
        default_factory=date.today,
        description="Jour concerné par ce marquage d'assiduité (par défaut aujourd'hui).",
    )


class ActivityCorrection(BaseModel):
    model_config = ConfigDict(extra="forbid")

    note: str = Field(..., min_length=1, max_length=280, description="Raison de la correction.")
    started_at: datetime | None = Field(None, description="Nouvelle heure de début, si à corriger.")
    ended_at: datetime | None = Field(None, description="Nouvelle heure de fin, si à corriger.")
    status: Literal["present", "absent"] | None = Field(
        None, description="Nouveau statut ; uniquement pour corriger une activité de type attendance."
    )


class ProfileAttributes(BaseModel):
    model_config = ConfigDict(extra="forbid")

    Previous_Scores: float = Field(..., ge=0, le=100)
    Access_to_Resources: Literal["Low", "Medium", "High"]
    Parental_Involvement: Literal["Low", "Medium", "High"]


class AggregatedFeatures(StudentInput):
    window_days: int = Field(..., description="Taille de la fenêtre glissante utilisée pour l'agrégation, en jours.")
    days_logged: int = Field(
        ..., description="Nombre de jours distincts avec au moins un événement d'assiduité dans la fenêtre."
    )