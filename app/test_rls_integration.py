import shutil
import subprocess
import time
import uuid
from pathlib import Path

import pytest


ROOT = Path(__file__).parents[1]
MIGRATIONS = [
    ROOT / "supabase/migrations/_create_model_versions.sql",
    ROOT / "supabase/migrations/_create_predictions.sql",
    ROOT / "supabase/migrations/_predictions_policies.sql",
]


def _docker_available() -> bool:
    if shutil.which("docker") is None:
        return False
    return subprocess.run(
        ["docker", "info"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    ).returncode == 0


def _psql(container: str, sql: str, *, input_sql: str | None = None) -> str:
    command = [
        "docker",
        "exec",
        "-i" if input_sql is not None else "-i",
        container,
        "psql",
        "-U",
        "postgres",
        "-d",
        "spp_test",
        "-v",
        "ON_ERROR_STOP=1",
        "-At",
    ]
    if input_sql is None:
        command.extend(["-c", sql])
    result = subprocess.run(
        command,
        input=input_sql,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise AssertionError(result.stderr)
    return result.stdout.strip()


def _psql_when_ready(container: str, sql: str) -> str:
    last_error = None
    for _ in range(30):
        try:
            return _psql(container, sql)
        except AssertionError as error:
            last_error = error
            time.sleep(1)
    raise last_error


def test_rls_isolation_and_admin_visibility_with_real_postgres():
    if not _docker_available():
        pytest.skip("Docker/PostgreSQL local indisponible : test RLS non execute")

    container = f"spp-rls-test-{uuid.uuid4().hex[:10]}"
    run = subprocess.run(
        [
            "docker",
            "run",
            "--detach",
            "--name",
            container,
            "--env",
            "POSTGRES_PASSWORD=test",
            "--env",
            "POSTGRES_DB=spp_test",
            "postgres:16-alpine",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert run.returncode == 0, run.stderr

    try:
        ready = False
        for _ in range(30):
            probe = subprocess.run(
                [
                    "docker",
                    "exec",
                    container,
                    "pg_isready",
                    "-U",
                    "postgres",
                    "-d",
                    "spp_test",
                ],
                capture_output=True,
                check=False,
            )
            if probe.returncode == 0:
                ready = True
                break
            time.sleep(1)
        assert ready, "PostgreSQL n'est pas devenu disponible dans le conteneur"

        _psql_when_ready(
            container,
            """
            create role authenticated nologin;
            create schema auth;
            create table auth.users (id uuid primary key);
            create function auth.jwt() returns jsonb
            language sql stable
            as $$ select current_setting('request.jwt.claims', true)::jsonb $$;
            create function auth.uid() returns uuid
            language sql stable
            as $$ select (auth.jwt() ->> 'sub')::uuid $$;
            grant usage on schema auth, public to authenticated;
            grant execute on function auth.jwt(), auth.uid() to authenticated;
            """,
        )

        for migration in MIGRATIONS:
            _psql(container, "", input_sql=migration.read_text(encoding="utf-8"))

        _psql(
            container,
            """
            grant select, insert on public.model_versions, public.predictions
            to authenticated;
            insert into auth.users (id) values
                ('00000000-0000-0000-0000-0000000000a1'),
                ('00000000-0000-0000-0000-0000000000b2'),
                ('00000000-0000-0000-0000-0000000000ad');
            insert into public.predictions (
                user_id, model_version_id, attendance, hours_studied,
                previous_scores, tutoring_sessions, access_to_resources,
                parental_involvement, predicted_score, below_threshold
            ) values
                ('00000000-0000-0000-0000-0000000000a1', 1, 80, 10, 70, 2,
                 'High', 'High', 75, '[]'),
                ('00000000-0000-0000-0000-0000000000b2', 1, 80, 10, 70, 2,
                 'High', 'High', 75, '[]');
            """,
        )

        student_a_rows = _psql(
            container,
            """
            set role authenticated;
            set request.jwt.claims =
                '{"sub":"00000000-0000-0000-0000-0000000000a1",'
                '"app_metadata":{"role":"student"}}';
            select count(*) from public.predictions;
            select count(*) from public.predictions
            where user_id = '00000000-0000-0000-0000-0000000000b2';
            """,
        ).splitlines()[-2:]
        assert student_a_rows == ["1", "0"]

        admin_rows = _psql(
            container,
            """
            set role authenticated;
            set request.jwt.claims =
                '{"sub":"00000000-0000-0000-0000-0000000000ad",'
                '"app_metadata":{"role":"admin"}}';
            select count(*) from public.predictions;
            """,
        )
        assert admin_rows.splitlines()[-1] == "2"
    finally:
        subprocess.run(
            ["docker", "rm", "--force", container],
            capture_output=True,
            check=False,
        )