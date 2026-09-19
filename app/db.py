import os
from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]  # clé publique, PAS service_role


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