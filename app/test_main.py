from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_returns_200():
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert "model_name" in body
    assert "features" in body

def test_predict_valid_input():
    payload = {
        "Attendance": 85,
        "Hours_Studied": 20,
        "Previous_Scores": 75,
        "Tutoring_Sessions": 3,
        "Access_to_Resources": "High",
        "Parental_Involvement": "Medium",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert "predicted_score" in body
    assert "top_features" in body
    assert "below_threshold" in body

def test_predict_invalid_category_returns_422():
    payload = {
        "Attendance": 85,
        "Hours_Studied": 20,
        "Previous_Scores": 75,
        "Tutoring_Sessions": 3,
        "Access_to_Resources": "Invalid",
        "Parental_Involvement": "Medium",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_predict_edge_values():
    payload = {
        "Attendance": 0,
        "Hours_Studied": 0,
        "Previous_Scores": 0,
        "Tutoring_Sessions": 0,
        "Access_to_Resources": "Low",
        "Parental_Involvement": "Low",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200