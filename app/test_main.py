import os

import jwt
import pytest
from fastapi.testclient import TestClient

from app.main import app, pipeline_state
from app.model_loader import load_pipeline



@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def _token(role: str) -> str:
    return jwt.encode(
        {"sub": "user-123", "aud": "authenticated", "app_metadata": {"role": role}},
        os.environ["SUPABASE_JWT_SECRET"],
        algorithm="HS256",
    )

def test_root_returns_200(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert "model_name" in body
    assert "features" in body

def test_predict_valid_input(client):
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

def test_predict_invalid_category_returns_422(client):
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

def test_predict_edge_values(client):
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


def test_predict_out_of_range_returns_422(client):
    payload = {
        "Attendance": 101,
        "Hours_Studied": 20,
        "Previous_Scores": 75,
        "Tutoring_Sessions": 3,
        "Access_to_Resources": "High",
        "Parental_Involvement": "Medium",
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_authenticated_student_route_is_explicitly_unimplemented(client, monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")
    response = client.get(
        "/predictions/me",
        headers={"Authorization": f"Bearer {_token('student')}"},
    )
    assert response.status_code == 501


def test_admin_route_rejects_student(client, monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")
    response = client.get(
        "/admin/predictions",
        headers={"Authorization": f"Bearer {_token('student')}"},
    )
    assert response.status_code == 403


def test_admin_route_verifies_admin_role(client, monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")
    response = client.get(
        "/admin/predictions",
        headers={"Authorization": f"Bearer {_token('admin')}"},
    )
    assert response.status_code == 501


def test_admin_route_requires_token(client, monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")
    response = client.get("/admin/predictions")
    assert response.status_code == 401


def test_missing_model_is_explicit(tmp_path):
    missing_path = tmp_path / "missing.joblib"
    with pytest.raises(FileNotFoundError, match="Model artifact not found"):
        load_pipeline(missing_path)


def test_prediction_internal_error_returns_500(client, monkeypatch):
    class BrokenPipeline:
        def predict(self, row):
            raise ValueError("synthetic prediction failure")

    monkeypatch.setitem(pipeline_state, "pipeline", BrokenPipeline())
    response = client.post(
        "/predict",
        json={
            "Attendance": 85,
            "Hours_Studied": 20,
            "Previous_Scores": 75,
            "Tutoring_Sessions": 3,
            "Access_to_Resources": "High",
            "Parental_Involvement": "Medium",
        },
    )
    assert response.status_code == 500