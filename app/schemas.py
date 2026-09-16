from pydantic import BaseModel, Field
from typing import Literal

class StudentInput(BaseModel):

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
        description="Nombre de séances de soutien scolaire suivies. "
                    "Borné à la plage observée dans les données d'entraînement."
    )
    Access_to_Resources: Literal["Low", "Medium", "High"] = Field(
        ..., description="Niveau d'accès de l'étudiant aux ressources pédagogiques."
    )
    Parental_Involvement: Literal["Low", "Medium", "High"] = Field(
        ..., description="Niveau d'implication des parents dans la scolarité."
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