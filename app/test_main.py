import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "anon-key")

from app.main import app, pipeline_state
from app.model_loader import load_pipeline
from app import llm, repository


TEST_PRIVATE_KEY = ec.generate_private_key(ec.SECP256R1())
TEST_PUBLIC_KEY = TEST_PRIVATE_KEY.public_key()
TEST_KEY_ID = "test-es256-key"


def _mock_jwks_signing_key(self, token):
    return SimpleNamespace(key=TEST_PUBLIC_KEY)


@pytest.fixture(autouse=True)
def mock_jwks(monkeypatch):
    monkeypatch.setattr(jwt.PyJWKClient, "get_signing_key_from_jwt", _mock_jwks_signing_key)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def _token(role: str, *, metadata_field: str = "app_metadata") -> str:
    payload = {"sub": "user-123", "aud": "authenticated"}
    payload[metadata_field] = {"role": role}
    return jwt.encode(
        payload,
        TEST_PRIVATE_KEY,
        algorithm="ES256",
        headers={"kid": TEST_KEY_ID},
    )


def test_user_metadata_role_alone_is_rejected(client):
    # Security regression test: user_metadata is client-controlled (anyone can set
    # options.data.role at signup), so it must never be accepted as a role source
    # on its own. A token carrying a role only in user_metadata (no app_metadata
    # role) must be treated as having no application role at all.
    response = client.post(
        "/predict",
        json=_payload(),
        headers={"Authorization": f"Bearer {_token('admin', metadata_field='user_metadata')}"},
    )
    assert response.status_code == 401


def test_app_metadata_role_still_accepted(client):
    response = client.post(
        "/predict",
        json=_payload(),
        headers={"Authorization": f"Bearer {_token('student', metadata_field='app_metadata')}"},
    )
    assert response.status_code == 200


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


class FakeQueryTable:
    """Minimal in-memory stand-in for a Supabase PostgREST query, supporting
    just the chain of calls repository.py's activity_logs/profiles functions
    use: select/eq/neq/gte/lt/limit/order, plus insert/update. `rows` is a
    list shared with the owning FakeHabitTrackerClient, mutated in place so
    inserts/updates are visible to later calls in the same test."""

    def __init__(self, rows):
        self._rows = rows
        self._filters = []
        self._order = None
        self._limit = None
        self._pending_insert = None
        self._pending_update = None

    def select(self, columns=None):
        return self

    def insert(self, payload):
        self._pending_insert = payload
        return self

    def update(self, payload):
        self._pending_update = payload
        return self

    def eq(self, column, value):
        self._filters.append(("eq", column, value))
        return self

    def neq(self, column, value):
        self._filters.append(("neq", column, value))
        return self

    def gte(self, column, value):
        self._filters.append(("gte", column, value))
        return self

    def lt(self, column, value):
        self._filters.append(("lt", column, value))
        return self

    def limit(self, value):
        self._limit = value
        return self

    def order(self, column, desc=False):
        self._order = (column, desc)
        return self

    def _matches(self, row):
        for op, column, value in self._filters:
            row_value = row.get(column)
            if op == "eq" and row_value != value:
                return False
            if op == "neq" and row_value == value:
                return False
            if op == "gte" and (row_value is None or row_value < value):
                return False
            if op == "lt" and (row_value is None or row_value >= value):
                return False
        return True

    def execute(self):
        if self._pending_insert is not None:
            new_id = max([r["id"] for r in self._rows], default=0) + 1
            row = {"id": new_id, **self._pending_insert}
            self._rows.append(row)
            return SimpleNamespace(data=[row])

        matched = [row for row in self._rows if self._matches(row)]

        if self._pending_update is not None:
            for row in matched:
                row.update(self._pending_update)
            return SimpleNamespace(data=matched)

        if self._order is not None:
            column, desc = self._order
            matched = sorted(matched, key=lambda row: row.get(column), reverse=desc)
        if self._limit is not None:
            matched = matched[: self._limit]
        return SimpleNamespace(data=matched)


class FakeHabitTrackerClient:
    """Fake Supabase client covering only the tables the habit-tracker
    endpoints touch (activity_logs, profiles). Row lists are kept as
    attributes so tests can assert on post-call state directly."""

    def __init__(self, activity_rows=None, profile_rows=None):
        self._activity_rows = activity_rows if activity_rows is not None else []
        self._profile_rows = profile_rows if profile_rows is not None else []

    def table(self, name):
        if name == "activity_logs":
            return FakeQueryTable(self._activity_rows)
        if name == "profiles":
            return FakeQueryTable(self._profile_rows)
        raise AssertionError(f"unexpected table {name!r} in habit-tracker test")


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
        / "0003_create_predictions_policies.sql"
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
        / "0001_create_model_versions.sql"
    )
    migration_sql = migration_path.read_text(encoding="utf-8")

    assert "create table if not exists public.model_versions" in migration_sql
    assert 'for select\nto authenticated\nusing (true)' in migration_sql
    assert "coalesce(auth.jwt() -> 'app_metadata' ->> 'role'" in migration_sql
    assert "= 'admin'" in migration_sql


def test_predictions_and_model_versions_rls_no_longer_trust_forgeable_claims():
    # Security regression test: 0003_create_predictions_policies.sql,
    # 0001_create_model_versions.sql and 0004_create_profiles_and_fix_model_versions.sql
    # all authorized on coalesce(app_metadata.role, jwt.user_role, jwt.role) -- the
    # same class of bug fixed in app/auth.py::_extract_role (user_role/raw "role" are
    # not a trusted role source). 0007_harden_role_checks_in_rls_policies.sql
    # re-defines every one of those policies to check app_metadata.role only; this
    # asserts that migration doesn't reintroduce the untrusted claims anywhere in
    # its SQL.
    migration_path = (
        Path(__file__).parents[1]
        / "supabase"
        / "migrations"
        / "0007_harden_role_checks_in_rls_policies.sql"
    )
    migration_sql = migration_path.read_text(encoding="utf-8")

    sql_lines = [line for line in migration_sql.splitlines() if not line.strip().startswith("--")]
    policy_sql = "\n".join(sql_lines)

    assert "user_role" not in policy_sql
    # The untrusted bare claim is `jwt() ->> 'role'`; this must not be confused
    # with the trusted `jwt() -> 'app_metadata' ->> 'role'`, which does contain
    # "->> 'role'" as a substring but is a different, safe expression.
    assert "jwt() ->> 'role'" not in policy_sql
    assert policy_sql.count("app_metadata' ->> 'role'") == 9

    for policy_name in (
        "students can read their own predictions",
        "admins can read all predictions",
        "students can insert their own predictions",
        "admins can insert predictions",
        "admins can insert model versions",
        "admins can update model versions",
        "admins can delete model versions",
        "profiles_admin_can_read_all",
    ):
        assert f'"{policy_name}"' in migration_sql


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


def test_explicit_persistence_returns_500_when_database_write_fails(client, monkeypatch):
    def fail_create_prediction(**kwargs):
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(repository, "create_prediction", fail_create_prediction)
    response = client.post("/predictions", json=_payload(), headers=_headers())
    assert response.status_code == 500


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


# --- Habit tracker: start/stop activities ---

def test_start_activity_creates_in_progress_row(client, monkeypatch):
    fake_client = FakeHabitTrackerClient()
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.post(
        "/activities/start",
        json={"activity_type": "study_session"},
        headers=_headers(),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["activity_type"] == "study_session"
    assert body["status"] == "in_progress"


def test_start_activity_rejects_duplicate_in_progress(client, monkeypatch):
    fake_client = FakeHabitTrackerClient(activity_rows=[
        {"id": 1, "user_id": "user-123", "activity_type": "study_session",
         "status": "in_progress", "started_at": "2026-09-22T08:00:00+00:00"},
    ])
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.post(
        "/activities/start",
        json={"activity_type": "study_session"},
        headers=_headers(),
    )
    assert response.status_code == 409


def test_stop_activity_completes_row(client, monkeypatch):
    fake_client = FakeHabitTrackerClient(activity_rows=[
        {"id": 1, "user_id": "user-123", "activity_type": "study_session",
         "status": "in_progress", "started_at": "2026-09-22T08:00:00+00:00"},
    ])
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.post("/activities/1/stop", headers=_headers())
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "completed"
    assert body["ended_at"] is not None


def test_stop_activity_requires_in_progress(client, monkeypatch):
    fake_client = FakeHabitTrackerClient(activity_rows=[
        {"id": 1, "user_id": "user-123", "activity_type": "study_session",
         "status": "completed", "started_at": "2026-09-22T08:00:00+00:00",
         "ended_at": "2026-09-22T09:00:00+00:00"},
    ])
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.post("/activities/1/stop", headers=_headers())
    assert response.status_code == 409


def test_stop_activity_unknown_id_returns_404(client, monkeypatch):
    fake_client = FakeHabitTrackerClient()
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.post("/activities/999/stop", headers=_headers())
    assert response.status_code == 404


def test_stop_activity_of_another_user_returns_404(client, monkeypatch):
    # RLS would also block this in production; the repository query filters
    # on user_id too, so a cross-user id must behave like "not found".
    fake_client = FakeHabitTrackerClient(activity_rows=[
        {"id": 1, "user_id": "other-user", "activity_type": "study_session",
         "status": "in_progress", "started_at": "2026-09-22T08:00:00+00:00"},
    ])
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.post("/activities/1/stop", headers=_headers())
    assert response.status_code == 404


# --- Habit tracker: attendance and corrections ---

def test_mark_attendance_supersedes_same_day_entry(client, monkeypatch):
    fake_client = FakeHabitTrackerClient(activity_rows=[
        {"id": 1, "user_id": "user-123", "activity_type": "attendance",
         "status": "absent", "started_at": "2026-09-22T00:00:00+00:00"},
    ])
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.post(
        "/activities/attendance",
        json={"status": "present", "log_date": "2026-09-22"},
        headers=_headers(),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "present"
    assert body["corrected_from"] == 1
    # the original row must be superseded, never left as an active "absent" mark
    assert fake_client._activity_rows[0]["status"] == "corrected"


def test_correct_activity_supersedes_and_inserts_new(client, monkeypatch):
    fake_client = FakeHabitTrackerClient(activity_rows=[
        {"id": 1, "user_id": "user-123", "activity_type": "study_session",
         "status": "completed", "started_at": "2026-09-22T08:00:00+00:00",
         "ended_at": "2026-09-22T08:30:00+00:00"},
    ])
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.post(
        "/activities/1/correct",
        json={"note": "forgot to stop the timer, real end was 09:00"},
        headers=_headers(),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["corrected_from"] == 1
    assert body["note"] == "forgot to stop the timer, real end was 09:00"
    assert fake_client._activity_rows[0]["status"] == "corrected"


def test_correct_activity_unknown_id_returns_404(client, monkeypatch):
    fake_client = FakeHabitTrackerClient()
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.post(
        "/activities/999/correct",
        json={"note": "does not exist"},
        headers=_headers(),
    )
    assert response.status_code == 404


def test_list_my_activities_scoped_to_user(client, monkeypatch):
    fake_client = FakeHabitTrackerClient(activity_rows=[
        {"id": 1, "user_id": "user-123", "activity_type": "study_session",
         "status": "completed", "started_at": "2026-09-22T08:00:00+00:00",
         "ended_at": "2026-09-22T08:30:00+00:00"},
        {"id": 2, "user_id": "other-user", "activity_type": "study_session",
         "status": "completed", "started_at": "2026-09-22T08:00:00+00:00",
         "ended_at": "2026-09-22T08:30:00+00:00"},
    ])
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.get("/activities/me", headers=_headers())
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == 1


# --- Habit tracker: profile attributes ---

def test_update_profile_attributes_round_trip(client, monkeypatch):
    fake_client = FakeHabitTrackerClient(profile_rows=[
        {"id": "user-123", "role": "student", "previous_scores": None,
         "access_to_resources": None, "parental_involvement": None},
    ])
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    put_response = client.put(
        "/me/profile-attributes",
        json={"Previous_Scores": 82, "Access_to_Resources": "High", "Parental_Involvement": "Medium"},
        headers=_headers(),
    )
    assert put_response.status_code == 200

    get_response = client.get("/me/profile-attributes", headers=_headers())
    assert get_response.status_code == 200
    body = get_response.json()
    assert body["previous_scores"] == 82
    assert body["access_to_resources"] == "High"
    assert body["parental_involvement"] == "Medium"


def test_update_profile_attributes_missing_row_returns_404(client, monkeypatch):
    fake_client = FakeHabitTrackerClient()  # no profile row exists for this user
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.put(
        "/me/profile-attributes",
        json={"Previous_Scores": 82, "Access_to_Resources": "High", "Parental_Involvement": "Medium"},
        headers=_headers(),
    )
    assert response.status_code == 404


# --- Habit tracker: feature aggregation and predict-from-activity ---

def test_features_requires_attendance_marked(client, monkeypatch):
    fake_client = FakeHabitTrackerClient()
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.get("/me/features", headers=_headers())
    assert response.status_code == 409


def test_features_requires_complete_profile(client, monkeypatch):
    now = datetime.now(timezone.utc)
    fake_client = FakeHabitTrackerClient(
        activity_rows=[
            {"id": 1, "user_id": "user-123", "activity_type": "attendance",
             "status": "present", "started_at": now.isoformat()},
        ],
        profile_rows=[
            {"id": "user-123", "previous_scores": None,
             "access_to_resources": None, "parental_involvement": None},
        ],
    )
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.get("/me/features", headers=_headers())
    assert response.status_code == 409


def test_features_aggregates_completed_activities(client, monkeypatch):
    now = datetime.now(timezone.utc)
    fake_client = FakeHabitTrackerClient(
        activity_rows=[
            {"id": 1, "user_id": "user-123", "activity_type": "attendance",
             "status": "present", "started_at": now.isoformat()},
            {"id": 2, "user_id": "user-123", "activity_type": "attendance",
             "status": "absent", "started_at": (now - timedelta(days=1)).isoformat()},
            {"id": 3, "user_id": "user-123", "activity_type": "study_session",
             "status": "completed", "started_at": now.isoformat(),
             "ended_at": (now + timedelta(hours=2)).isoformat()},
            {"id": 4, "user_id": "user-123", "activity_type": "tutoring_session",
             "status": "completed", "started_at": now.isoformat(),
             "ended_at": (now + timedelta(hours=1)).isoformat()},
        ],
        profile_rows=[
            {"id": "user-123", "previous_scores": 75,
             "access_to_resources": "High", "parental_involvement": "Medium"},
        ],
    )
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    response = client.get("/me/features", headers=_headers())
    assert response.status_code == 200
    body = response.json()
    assert body["Attendance"] == 50.0  # 1 present out of 2 marked days
    assert body["Hours_Studied"] == 2.0
    assert body["Tutoring_Sessions"] == 1
    assert body["Previous_Scores"] == 75
    assert body["Access_to_Resources"] == "High"
    assert body["Parental_Involvement"] == "Medium"
    assert body["days_logged"] == 2


def test_predict_from_activity_uses_aggregated_features(client, monkeypatch):
    now = datetime.now(timezone.utc)
    fake_client = FakeHabitTrackerClient(
        activity_rows=[
            {"id": 1, "user_id": "user-123", "activity_type": "attendance",
             "status": "present", "started_at": now.isoformat()},
            {"id": 2, "user_id": "user-123", "activity_type": "study_session",
             "status": "completed", "started_at": now.isoformat(),
             "ended_at": (now + timedelta(hours=2)).isoformat()},
        ],
        profile_rows=[
            {"id": "user-123", "previous_scores": 75,
             "access_to_resources": "High", "parental_involvement": "Medium"},
        ],
    )
    monkeypatch.setattr(repository, "get_supabase_client", lambda token: fake_client)
    # Best-effort persistence: this fake client has no "predictions"/"model_versions"
    # tables, so the write inside predict_from_activity fails and is swallowed,
    # exactly like test_predict_returns_200_when_database_write_fails above.
    response = client.post("/predict/from-activity", headers=_headers())
    assert response.status_code == 200
    body = response.json()
    assert "predicted_score" in body


# --- LLM recommendations (roadmap Phase 6) ---

def _recommendation_payload():
    return {
        "predicted_score": 64.4,
        "top_features": {"Attendance": 2.292, "Hours_Studied": 1.748},
        "below_threshold": ["Hours_Studied", "Tutoring_Sessions"],
    }


class FakeGroqResponse:
    def __init__(self, status_code=200, body=None):
        self.status_code = status_code
        self._body = body or {
            "choices": [{"message": {"content": "Continuez ainsi, en augmentant vos heures d'étude."}}]
        }

    def raise_for_status(self):
        if self.status_code >= 400:
            request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
            response = httpx.Response(self.status_code, request=request)
            raise httpx.HTTPStatusError("error", request=request, response=response)

    def json(self):
        return self._body


def test_recommendation_requires_token(client):
    response = client.post("/predict/recommendation", json=_recommendation_payload())
    assert response.status_code == 401


def test_recommendation_missing_api_key_returns_503(client, monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    response = client.post(
        "/predict/recommendation", json=_recommendation_payload(), headers=_headers()
    )
    assert response.status_code == 503
    assert "GROQ_API_KEY" in response.json()["detail"]


def test_recommendation_success(client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    monkeypatch.setattr(llm.httpx, "post", lambda *a, **k: FakeGroqResponse())
    response = client.post(
        "/predict/recommendation", json=_recommendation_payload(), headers=_headers()
    )
    assert response.status_code == 200
    assert response.json() == {
        "recommendation": "Continuez ainsi, en augmentant vos heures d'étude."
    }


def test_recommendation_upstream_error_returns_503(client, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    monkeypatch.setattr(llm.httpx, "post", lambda *a, **k: FakeGroqResponse(status_code=429))
    response = client.post(
        "/predict/recommendation", json=_recommendation_payload(), headers=_headers()
    )
    assert response.status_code == 503


def test_recommendation_never_leaks_raw_student_data(client, monkeypatch):
    # The LLM must only ever see the already-computed prediction, never a raw
    # StudentInput payload -- extra="forbid" on RecommendationRequest enforces this.
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    monkeypatch.setattr(llm.httpx, "post", lambda *a, **k: FakeGroqResponse())
    payload = {**_recommendation_payload(), "Attendance": 85}
    response = client.post("/predict/recommendation", json=payload, headers=_headers())
    assert response.status_code == 422