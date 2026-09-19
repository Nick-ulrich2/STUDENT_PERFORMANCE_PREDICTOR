import os
from pathlib import Path

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


class FakeSupabaseTable:
    def __init__(self):
        self.inserted_payload = None
        self.selected_columns = None

    def insert(self, payload):
        self.inserted_payload = payload
        return self

    def select(self, columns):
        self.selected_columns = columns
        return self

    def execute(self):
        if self.inserted_payload is not None:
            return type("Response", (), {"data": [{"id": "prediction-1", **self.inserted_payload}]})()
        return type("Response", (), {"data": [{"id": "prediction-1"}]})()


class FakeSupabaseClient:
    def __init__(self):
        self.predictions = FakeSupabaseTable()

    def table(self, name):
        assert name == "predictions"
        return self.predictions

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


def test_student_history_route_uses_rls_query(client, monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")
    monkeypatch.setattr("app.main._get_supabase_client", lambda token: FakeSupabaseClient())
    response = client.get(
        "/predictions/me",
        headers={"Authorization": f"Bearer {_token('student')}"},
    )
    assert response.status_code == 200


def test_create_prediction_requires_token(client):
    response = client.post(
        "/predictions",
        json={
            "Attendance": 85,
            "Hours_Studied": 20,
            "Previous_Scores": 75,
            "Tutoring_Sessions": 3,
            "Access_to_Resources": "High",
            "Parental_Involvement": "Medium",
        },
    )
    assert response.status_code == 401


def test_create_prediction_persists_model_output(client, monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")
    fake_client = FakeSupabaseClient()
    monkeypatch.setattr("app.main._get_supabase_client", lambda token: fake_client)
    response = client.post(
        "/predictions",
        json={
            "Attendance": 85,
            "Hours_Studied": 20,
            "Previous_Scores": 75,
            "Tutoring_Sessions": 3,
            "Access_to_Resources": "High",
            "Parental_Involvement": "Medium",
        },
        headers={"Authorization": f"Bearer {_token('student')}"},
    )
    assert response.status_code == 200
    assert fake_client.predictions.inserted_payload["user_id"] == "user-123"
    assert "predicted_score" in fake_client.predictions.inserted_payload
    assert fake_client.predictions.inserted_payload["model_name"] == "Ridge"


def test_admin_route_rejects_student(client, monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")
    response = client.get(
        "/admin/predictions",
        headers={"Authorization": f"Bearer {_token('student')}"},
    )
    assert response.status_code == 403


def test_admin_route_verifies_admin_role(client, monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")
    monkeypatch.setattr("app.main._get_supabase_client", lambda token: FakeSupabaseClient())
    response = client.get(
        "/admin/predictions",
        headers={"Authorization": f"Bearer {_token('admin')}"},
    )
    assert response.status_code == 200


def test_admin_route_requires_token(client, monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")
    response = client.get("/admin/predictions")
    assert response.status_code == 401


def test_admin_insert_policy_exists_in_migration():
    migration_path = (
        Path(__file__).parents[1]
        / "supabase"
        / "migrations"
        / "202609190002_add_admin_insert_policy.sql"
    )
    migration_sql = migration_path.read_text(encoding="utf-8")

    assert 'create policy "admins can insert predictions"' in migration_sql
    assert "for insert" in migration_sql
    assert "= 'admin'" in migration_sql


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