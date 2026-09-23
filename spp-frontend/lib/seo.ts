// Canonical public URL of this deployment. Falls back to localhost so
// metadataBase/sitemap/robots never throw during local dev when the env var
// isn't set — but this MUST be set to the real production domain at deploy
// time (see .env.local.example) for canonical/OG/sitemap URLs to be correct.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3001').replace(/\/+$/, '');

export const SITE_NAME = 'SPP — Student Performance Predictor';

export const SITE_DESCRIPTION =
  "Suivez vos habitudes d'étude réelles (assiduité, temps de travail, tutorat) et recevez une estimation de votre performance scolaire, calculée par un modèle de machine learning et expliquée par une IA — pas un questionnaire, pas une boîte noire.";

// Applied via each private route group's layout.tsx: dashboards, the
// tracker, history and admin pages have no content of value to a search
// engine (they're per-user private data behind auth) and must never be
// indexed, unlike the public marketing homepage.
export const NOINDEX_ROBOTS = { index: false, follow: false };
