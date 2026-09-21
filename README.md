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
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`

## Lancer le projet localement
Le frontend est démarré sur le port 3001 par défaut pour éviter le conflit local sur 3000.

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

Les routes `/predict`, `/predictions`, `/predictions/me` et `/admin/predictions` sont connectées au client Supabase et exigent un JWT ES256 valide ; le rôle doit être présent dans `app_metadata.role` (`student` ou `admin`). Exécute les migrations SQL du dossier `supabase/migrations` sur le dashboard Supabase.

La source de vérité des tables et policies est `supabase/migrations`. Le test RLS local réel utilise Docker/PostgreSQL ; l’exécution distante et le test end-to-end avec de vrais comptes restent manuels.

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