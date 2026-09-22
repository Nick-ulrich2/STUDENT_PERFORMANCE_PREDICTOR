import shutil
import subprocess
import time
import uuid
from pathlib import Path

import pytest


ROOT = Path(__file__).parents[1]
# Every migration file, in the exact numeric order they are meant to be applied
# in (and that Supabase CLI / a dashboard "run all" would use, since filenames
# now sort correctly). Running the *complete* real set here -- not a hand-picked
# subset -- is what catches schema-wide issues like the profiles RLS infinite
# recursion bug that a partial migration list previously missed entirely.
MIGRATIONS = sorted((ROOT / "supabase/migrations").glob("*.sql"))


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
            create table auth.users (
                id uuid primary key default gen_random_uuid(),
                raw_app_meta_data jsonb not null default '{}'::jsonb,
                raw_user_meta_data jsonb not null default '{}'::jsonb,
                created_at timestamptz not null default now()
            );
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
            grant select, update on public.profiles to authenticated;
            grant select, insert, update on public.activity_logs to authenticated;
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

        # profiles: the auto-provisioning trigger (0006) must have created one
        # row per signed-up user, and reading it must NOT hit infinite RLS
        # recursion (the real bug this test previously could not catch,
        # because it only ever applied a 3-file subset of the migrations that
        # never included profiles at all).
        student_a_own_profile = _psql(
            container,
            """
            set role authenticated;
            set request.jwt.claims =
                '{"sub":"00000000-0000-0000-0000-0000000000a1",'
                '"app_metadata":{"role":"student"}}';
            select count(*) from public.profiles;
            select count(*) from public.profiles
            where id = '00000000-0000-0000-0000-0000000000b2';
            """,
        ).splitlines()[-2:]
        assert student_a_own_profile == ["1", "0"], (
            "a student must see exactly their own profiles row and nobody "
            "else's -- if this raises instead of returning, the profiles RLS "
            "policy is recursive again"
        )

        admin_profiles = _psql(
            container,
            """
            set role authenticated;
            set request.jwt.claims =
                '{"sub":"00000000-0000-0000-0000-0000000000ad",'
                '"app_metadata":{"role":"admin"}}';
            select count(*) from public.profiles;
            """,
        )
        assert admin_profiles.splitlines()[-1] == "3"

        # activity_logs: same isolation shape as predictions.
        _psql(
            container,
            """
            set role authenticated;
            set request.jwt.claims =
                '{"sub":"00000000-0000-0000-0000-0000000000a1",'
                '"app_metadata":{"role":"student"}}';
            insert into public.activity_logs
                (user_id, activity_type, status, started_at)
            values
                ('00000000-0000-0000-0000-0000000000a1', 'study_session',
                 'in_progress', now());
            """,
        )
        student_b_activity_logs = _psql(
            container,
            """
            set role authenticated;
            set request.jwt.claims =
                '{"sub":"00000000-0000-0000-0000-0000000000b2",'
                '"app_metadata":{"role":"student"}}';
            select count(*) from public.activity_logs;
            """,
        )
        assert student_b_activity_logs.splitlines()[-1] == "0"

        admin_activity_logs = _psql(
            container,
            """
            set role authenticated;
            set request.jwt.claims =
                '{"sub":"00000000-0000-0000-0000-0000000000ad",'
                '"app_metadata":{"role":"admin"}}';
            select count(*) from public.activity_logs;
            """,
        )
        assert admin_activity_logs.splitlines()[-1] == "1"
    finally:
        subprocess.run(
            ["docker", "rm", "--force", container],
            capture_output=True,
            check=False,
        )