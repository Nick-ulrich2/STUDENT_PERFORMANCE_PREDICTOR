from pydantic import BaseModel, Field
from typing import Literal

class StudentInput(BaseModel):
    Attendance: float = Field(..., ge=0, le=100)
    Hours_Studied: float = Field(..., ge=0, le=60)
    Previous_Scores: float = Field(..., ge=0, le=100)
    Tutoring_Sessions: int = Field(..., ge=0)
    Access_to_Resources: Literal["Low", "Medium", "High"]
    Parental_Involvement: Literal["Low", "Medium", "High"]


class PredictionOutput(BaseModel):
    model_name: str
    predicted_score: float=Field(..., ge=0, le=100)
    top_features: dict
    below_threshold: list[str]