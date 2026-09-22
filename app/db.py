import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL manquant — vérifier que .env est chargé avant uvicorn")
if not SUPABASE_ANON_KEY:
    raise RuntimeError("SUPABASE_ANON_KEY manquant — vérifier que .env est chargé avant uvicorn")


def get_supabase_client(jwt: str) -> Client:
    """
    Crée un client Supabase configuré avec le JWT de l'utilisateur courant.
    C'est ce JWT qui permet à auth.uid() de fonctionner côté RLS.
    Un client = une requête = un utilisateur. Ne jamais réutiliser un client
    entre deux utilisateurs différents.
    """
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.postgrest.auth(jwt)
    return client