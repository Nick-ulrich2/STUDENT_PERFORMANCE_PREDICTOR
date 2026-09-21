from pathlib import Path

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient

from app.main import app, pipeline_state
from app.model_loader import load_pipeline
from app import repository


TEST_PRIVATE_KEY = ec.generate_private_key(ec.SECP256R1())
TEST_PUBLIC_KEY = TEST_PRIVATE_KEY.public_key()
TEST_KEY_ID = "test-es256-key"


class FakeSigningKey:
    key = TEST_PUBLIC_KEY



@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def mock_jwks_client(monkeypatch):
    monkeypatch.setattr(
        "app.auth.jwk_client.get_signing_key_from_jwt",
        lambda token: FakeSigningKey(),
    )


def _token(role: str) -> str:
    return jwt.encode(
        {"sub": "user-123", "aud": "authenticated", "app_metadata": {"role": role}},
        TEST_PRIVATE_KEY,
        algorithm="ES256",
        headers={"kid": TEST_KEY_ID},
    )


class FakeSupabaseTable:
    def __init__(self, name):
        self.name = name
        self.inserted_payload = None
        self.selected_columns = None
        self.filters = {}

    def insert(self, payload):
        self.inserted_payload = payload
        return self

    def select(self, columns):
        self.selected_columns = columns
        return self

    def eq(self, column, value):
        self.filters[column] = value
        return self

    def limit(self, value):
        return self

    def execute(self):
        if self.inserted_payload is not None:
            return type("Response", (), {"data": [{"id": "prediction-1", **self.inserted_payload}]})()
        if self.name == "model_versions":
            return type("Response", (), {"data": [{"id": 1}]})()
        rows = [
            {"id": 1, "user_id": "user-123"},
            {"id": 2, "user_id": "other-user"},
        ]
        user_id = self.filters.get("user_id")
        if user_id is not None:
            rows = [row for row in rows if row["user_id"] == user_id]
        return type("Response", (), {"data": rows})()


class FakeSupabaseClient:
    def __init__(self):
        self.model_versions = FakeSupabaseTable("model_versions")
        self.predictions = FakeSupabaseTable("predictions")

    def table(self, name):
        return getattr(self, name)


def _headers(role="student"):
    return {"Authorization": f"Bearer {_token(role)}"}


def _payload():
    return {
        "Attendance": 85,
        "Hours_Studied": 20,
        "Previous_Scores": 75,
        "Tutoring_Sessions": 3,
        "Access_to_Resources": "High",
        "Parental_Involvement": "Medium",
    }

def test_root_returns_200(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert "model_name" in body
    assert "features" in body

def test_predict_valid_input(client):
    response = client.post("/predict", json=_payload(), headers=_headers())
    assert response.status_code == 200
    body = response.json()
    assert "predicted_score" in body
    assert "top_features" in body
    assert "below_threshold" in body

def test_predict_invalid_category_returns_422(client):
    response = client.post(
        "/predict",
        json={**_payload(), "Access_to_Resources": "Invalid"},
        headers=_headers(),
    )
    assert response.status_code == 422

def test_predict_edge_values(client):
    response = client.post(
        "/predict",
        json={
            **_payload(),
            "Attendance": 0,
            "Hours_Studied": 0,
            "Previous_Scores": 0,
            "Tutoring_Sessions": 0,
            "Access_to_Resources": "Low",
            "Parental_Involvement": "Low",
        },
        headers=_headers(),
    )
    assert response.status_code == 200


def test_predict_out_of_range_returns_422(client):
    response = client.post(
        "/predict", json={**_payload(), "Attendance": 101}, headers=_headers()
    )
    assert response.status_code == 422


def test_student_history_route_uses_rls_query(client, monkeypatch):
    fake_client = FakeSupabaseClient()
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.get(
        "/predictions/me",
        headers=_headers(),
    )
    assert response.status_code == 200
    assert response.json() == [{"id": 1, "user_id": "user-123"}]


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
    fake_client = FakeSupabaseClient()
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.post(
        "/predict", json=_payload(), headers=_headers()
    )
    assert response.status_code == 200
    assert fake_client.predictions.inserted_payload["user_id"] == "user-123"
    assert fake_client.predictions.inserted_payload["model_version_id"] == 1
    assert fake_client.predictions.inserted_payload["attendance"] == 85.0
    assert "predicted_score" in fake_client.predictions.inserted_payload
    assert "model_name" not in fake_client.predictions.inserted_payload


def test_admin_route_rejects_student(client, monkeypatch):
    response = client.get(
        "/admin/predictions",
        headers=_headers(),
    )
    assert response.status_code == 403


def test_admin_route_verifies_admin_role(client, monkeypatch):
    fake_client = FakeSupabaseClient()
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.get(
        "/admin/predictions",
        headers=_headers("admin"),
    )
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_admin_route_requires_token(client, monkeypatch):
    response = client.get("/admin/predictions")
    assert response.status_code == 401


def test_admin_insert_policy_exists_in_migration():
    migration_path = (
        Path(__file__).parents[1]
        / "supabase"
        / "migrations"
        / "_predictions_policies.sql"
    )
    migration_sql = migration_path.read_text(encoding="utf-8")

    assert 'create policy "admins can insert predictions"' in migration_sql
    assert "for insert" in migration_sql
    assert "= 'admin'" in migration_sql
    admin_policy = migration_sql.split(
        'create policy "admins can insert predictions"', 1
    )[1]
    assert "auth.uid() = user_id" not in admin_policy


def test_model_versions_migration_has_authenticated_read_and_admin_write():
    migration_path = (
        Path(__file__).parents[1]
        / "supabase"
        / "migrations"
        / "_create_model_versions.sql"
    )
    migration_sql = migration_path.read_text(encoding="utf-8")

    assert "create table if not exists public.model_versions" in migration_sql
    assert 'for select\nto authenticated\nusing (true)' in migration_sql
    assert "coalesce(auth.jwt() -> 'app_metadata' ->> 'role'" in migration_sql
    assert "= 'admin'" in migration_sql


def test_student_history_is_scoped_to_authenticated_user(client, monkeypatch):
    fake_client = FakeSupabaseClient()
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.get("/predictions/me", headers=_headers())
    assert response.status_code == 200
    assert all(row["user_id"] == "user-123" for row in response.json())


def test_predict_returns_200_when_database_write_fails(client, monkeypatch):
    def fail_create_prediction(**kwargs):
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(repository, "create_prediction", fail_create_prediction)
    response = client.post("/predict", json=_payload(), headers=_headers())
    assert response.status_code == 200
    assert "predicted_score" in response.json()


def test_missing_model_is_explicit(tmp_path):
    missing_path = tmp_path / "missing.joblib"
    with pytest.raises(FileNotFoundError, match="Model artifact not found"):
        load_pipeline(missing_path)


def test_prediction_internal_error_returns_500(client, monkeypatch):
    class BrokenPipeline:
        def predict(self, row):
            raise ValueError("synthetic prediction failure")

    monkeypatch.setitem(pipeline_state, "pipeline", BrokenPipeline())
    response = client.post("/predict", json=_payload(), headers=_headers())
    assert response.status_code == 500