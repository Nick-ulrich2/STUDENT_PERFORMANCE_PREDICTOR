# Student Performance Predictor — Backend

## Installation
pip install -r requirements.txt

## Lancer l'API
uvicorn app.main:app --reload
Documentation interactive : http://localhost:8000/docs

## Lancer les tests
pytest

## Exemple de requête
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Attendance": 85,
    "Hours_Studied": 20,
    "Previous_Scores": 75,
    "Tutoring_Sessions": 3,
    "Access_to_Resources": "High",
    "Parental_Involvement": "Medium"
  }'