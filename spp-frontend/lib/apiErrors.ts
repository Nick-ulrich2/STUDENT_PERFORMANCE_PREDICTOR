// Turns raw API failures into a message a student can act on. The returned
// string is a French i18n key: callers display it with t(...). Anything we do
// not recognise (e.g. the French messages the API already sends) passes through.
export const ERR_NETWORK =
  'Impossible de joindre le serveur. Vérifiez votre connexion, ouvrez le site depuis son adresse officielle, puis réessayez.';
export const ERR_NO_ROLE = 'Votre compte n’a pas de rôle valide (compte ancien). Créez un nouveau compte pour continuer.';
export const ERR_SESSION = 'Votre session a expiré ou n’est plus valide. Déconnectez-vous, puis reconnectez-vous.';
export const ERR_FORBIDDEN = 'Accès réservé aux administrateurs.';
export const ERR_INVALID = 'Certaines valeurs sont invalides. Vérifiez les champs du formulaire.';
export const ERR_SERVER = 'Le serveur a rencontré une erreur. Réessayez dans un instant.';

export const API_ERROR_KEYS = [ERR_NETWORK, ERR_NO_ROLE, ERR_SESSION, ERR_FORBIDDEN, ERR_INVALID, ERR_SERVER];

export function friendlyDetail(status: number, raw: string): string {
  if (status === 0) return ERR_NETWORK;
  if (status === 401) return /application role/i.test(raw) ? ERR_NO_ROLE : ERR_SESSION;
  if (status === 403 && /admin role/i.test(raw)) return ERR_FORBIDDEN;
  if (status === 422) return ERR_INVALID;
  if (/^Request failed with status/i.test(raw) || (status >= 500 && !/[àâéèêëîïôùûç]/i.test(raw))) return ERR_SERVER;
  return raw;
}
