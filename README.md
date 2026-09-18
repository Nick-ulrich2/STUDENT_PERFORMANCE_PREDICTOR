# Student Performance Predictor — Backend

## Installation
pip install -r requirements.txt

## Lancer l'API
uvicorn app.main:app --reload
Documentation interactive : http://localhost:8000/docs

## Lancer les tests
pytest

## Preparation Supabase

Les routes `/predictions`, `/predictions/me` et `/admin/predictions` sont des contrats prepares mais retournent `501` tant que Supabase n'est pas connecte. Les routes authentifiees exigent un JWT signe avec `SUPABASE_JWT_SECRET`; le role doit etre present dans `app_metadata.role` (`student` ou `admin`).

Variables locales attendues, dans un fichier `.env` non commite :

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (backend uniquement, jamais expose au frontend)
- `SUPABASE_JWT_SECRET`
- `SUPABASE_JWT_AUDIENCE` (optionnel, defaut `authenticated`)

La source de verite des tables et policies sera `supabase/migrations`. La connexion reelle, les migrations et les policies RLS sont documentees dans `docs/ADR-001-supabase-auth-and-roles.md` mais ne sont pas encore implementees.

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