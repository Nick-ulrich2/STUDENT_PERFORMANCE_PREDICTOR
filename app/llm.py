"""LLM recommendation layer (roadmap Phase 6).

Strict separation from the ML layer: this module never influences
`predicted_score` — it only turns an already-computed prediction into a
short, human-readable explanation. Ridge regression predicts; the LLM
explains. Provider: Groq (OpenAI-compatible chat completions API, free
tier, no credit card required).
"""

import logging
import os

import httpx

logger = logging.getLogger("app.llm")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.1-8b-instant"

HUMAN_LABELS = {
    "Attendance": "l'assiduité",
    "Hours_Studied": "les heures d'étude",
    "Previous_Scores": "le score précédent",
    "Tutoring_Sessions": "les séances de tutorat",
    "Access_to_Resources": "l'accès aux ressources",
    "Parental_Involvement": "l'implication parentale",
}

SYSTEM_PROMPT = (
    "Tu es un assistant pédagogique pour Student Performance Predictor (SPP), une "
    "application qui aide des étudiants à comprendre les habitudes liées à leur "
    "performance scolaire. Un modèle de machine learning (régression Ridge) vient "
    "de produire une prédiction de score d'examen. Ton rôle est d'expliquer ce "
    "résultat et de proposer une piste concrète, jamais un diagnostic.\n\n"
    "Règles strictes :\n"
    "- Ne présente jamais cette prédiction comme un diagnostic, une note "
    "officielle ou une garantie de résultat futur : c'est un indicateur parmi "
    "d'autres, à traiter avec humilité.\n"
    "- N'invente aucune donnée non fournie dans le message utilisateur.\n"
    "- Base ta ou tes pistes uniquement sur les variables sous le seuil "
    "recommandé si la liste n'est pas vide ; sinon, encourage à maintenir les "
    "bonnes habitudes actuelles.\n"
    "- Réponds uniquement en français, sur un ton bienveillant et concret.\n"
    "- Pas de titre, pas de liste à puces, pas de gras : un seul paragraphe de "
    "60 mots maximum."
)


class RecommendationError(Exception):
    """Raised when a recommendation could not be generated (config, network, or upstream error)."""


def _build_user_prompt(
    predicted_score: float,
    top_features: dict[str, float],
    below_threshold: list[str],
) -> str:
    features_text = ", ".join(
        f"{HUMAN_LABELS.get(name, name)} ({coef:+.3f})"
        for name, coef in top_features.items()
    )
    if below_threshold:
        below_text = ", ".join(HUMAN_LABELS.get(name, name) for name in below_threshold)
        below_line = f"Variables sous le seuil recommandé : {below_text}."
    else:
        below_line = "Aucune variable sous le seuil recommandé."

    return (
        f"Score prédit : {predicted_score:.1f}/100.\n"
        f"Variables les plus influentes selon le modèle (coefficient, signe et "
        f"magnitude) : {features_text}.\n"
        f"{below_line}"
    )


def generate_recommendation(
    predicted_score: float,
    top_features: dict[str, float],
    below_threshold: list[str],
) -> str:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise RecommendationError(
            "GROQ_API_KEY manquant : configurez-le dans .env pour activer les "
            "recommandations (clé gratuite sur console.groq.com/keys)."
        )

    model = os.getenv("GROQ_MODEL", DEFAULT_MODEL)
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": _build_user_prompt(predicted_score, top_features, below_threshold),
            },
        ],
        "temperature": 0.4,
        "max_tokens": 200,
    }

    try:
        response = httpx.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15.0,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.exception("Groq a refusé la requête")
        raise RecommendationError(
            f"Le service de recommandation a refusé la requête (HTTP {exc.response.status_code})."
        ) from exc
    except httpx.HTTPError as exc:
        logger.exception("Groq injoignable")
        raise RecommendationError(
            "Le service de recommandation est momentanément indisponible."
        ) from exc

    body = response.json()
    try:
        return body["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as exc:
        logger.exception("Réponse Groq inattendue : %r", body)
        raise RecommendationError(
            "Réponse inattendue du service de recommandation."
        ) from exc
