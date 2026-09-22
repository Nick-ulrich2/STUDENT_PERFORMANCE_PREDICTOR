# Student Performance Predictor — Backend

## Installation
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd spp-frontend && npm install

## Variables d’environnement
Copiez les fichiers d’exemple puis renseignez les valeurs locales :

- `cp .env.example .env`
- `cp app/.env.example app/.env`
- `cp spp-frontend/.env.local.example spp-frontend/.env.local`

Fichiers attendus :

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (backend uniquement, jamais exposé au frontend)
- `SUPABASE_JWT_AUDIENCE` (optionnel, défaut `authenticated`)
- `FRONTEND_ORIGIN=http://127.0.0.1:3001`
- `GROQ_API_KEY` (optionnel — active les recommandations IA, voir *Recommandations IA* ci-dessous)
- `GROQ_MODEL` (optionnel, défaut `llama-3.1-8b-instant`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`

## Lancer le projet localement
Le frontend est démarré sur le port canonique 127.0.0.1:3001 et le backend sur 127.0.0.1:8000.

Backend :

source venv/bin/activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

Frontend :

cd spp-frontend
npm run dev -- --hostname 127.0.0.1 --port 3001

Le backend est disponible sur http://127.0.0.1:8000 et le frontend sur http://127.0.0.1:3001.

## Script utilitaire
Un script de démarrage est fourni pour nettoyer les ports et lancer les deux services dans le bon ordre :

./scripts/start-local.sh

Pour arrêter proprement les services de dev :

./scripts/stop-local.sh

## Lancer les tests
pytest

## Preparation Supabase

Les routes `/predict`, `/predictions`, `/predictions/me`, `/me` et `/admin/predictions` sont connectées au client Supabase et exigent un JWT ES256 valide vérifié via le JWKS public de Supabase (`{SUPABASE_URL}/auth/v1/.well-known/jwks.json`); le rôle doit être présent dans `app_metadata.role` (`student` ou `admin`). Exécute les migrations SQL du dossier `supabase/migrations` sur le dashboard Supabase.

La source de vérité des tables et policies est `supabase/migrations`. Le test RLS local réel utilise Docker/PostgreSQL ; l’exécution distante et le test end-to-end avec de vrais comptes restent manuels.

## Recommandations IA (roadmap Phase 6)

`POST /predict/recommendation` transforme une prédiction déjà calculée (score, variables
influentes, variables sous le seuil) en une explication courte générée par un LLM. Séparation
stricte des responsabilités : ce modèle ne voit jamais les données brutes de l'étudiant et ne
change jamais `predicted_score` — le Ridge prédit, le LLM explique.

Fournisseur : [Groq](https://console.groq.com/keys) (clé API gratuite, sans carte bancaire).

1. Créez un compte sur console.groq.com et générez une clé API.
2. Ajoutez-la à `app/.env` : `GROQ_API_KEY=...`
3. Sans clé configurée, la route répond `503` avec un message explicite ; le reste de
   l'application (prédiction, historique, admin) continue de fonctionner normalement.

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