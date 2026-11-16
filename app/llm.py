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
# Groq's free-tier model catalog changes over time (deprecations/renames); if this
# 404s, run `curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer
# $GROQ_API_KEY"` to see what's currently available, or set GROQ_MODEL in .env.
# Avoid "reasoning" models here (e.g. openai/gpt-oss-*): they spend max_tokens on
# a hidden chain-of-thought and can return an empty "content" before ever writing
# the final answer, unlike a plain instruct model such as this one.
DEFAULT_MODEL = "qwen/qwen3.8-27b"

HUMAN_LABELS = {
    "Attendance": "l'assiduité",
    "Hours_Studied": "les heures d'étude",
    "Previous_Scores": "le score précédent",
    "Tutoring_Sessions": "les séances de tutorat",
    "Access_to_Resources": "l'accès aux ressources",
    "Parental_Involvement": "l'implication parentale",
}

HUMAN_LABELS_EN = {
    "Attendance": "attendance",
    "Hours_Studied": "study hours",
    "Previous_Scores": "the previous score",
    "Tutoring_Sessions": "tutoring sessions",
    "Access_to_Resources": "access to resources",
    "Parental_Involvement": "parental involvement",
}

SYSTEM_PROMPT_EN = (
    "You are a teaching assistant for Student Performance Predictor (SPP), an "
    "application that helps students understand the habits linked to their "
    "academic performance. A machine learning model (Ridge regression) has just "
    "produced a predicted exam score. Your role is to explain this result and "
    "suggest one concrete next step, never a diagnosis.\n\n"
    "Strict rules:\n"
    "- Never present this prediction as a diagnosis, an official grade or a "
    "guarantee of future results: it is one indicator among others, to be "
    "treated with humility.\n"
    "- Do not invent any data that is not provided in the user message.\n"
    "- Base your suggestion(s) only on the variables below the recommended "
    "threshold if the list is not empty; otherwise, encourage keeping the "
    "current good habits.\n"
    "- Answer in English only, in a kind and concrete tone.\n"
    "- No title, no bullet list, no bold: a single paragraph of at most 60 words."
)

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


def _build_user_prompt_en(
    predicted_score: float,
    top_features: dict[str, float],
    below_threshold: list[str],
) -> str:
    features_text = ", ".join(
        f"{HUMAN_LABELS_EN.get(name, name)} ({coef:+.3f})"
        for name, coef in top_features.items()
    )
    if below_threshold:
        below_text = ", ".join(HUMAN_LABELS_EN.get(name, name) for name in below_threshold)
        below_line = f"Variables below the recommended threshold: {below_text}."
    else:
        below_line = "No variable below the recommended threshold."

    return (
        f"Predicted score: {predicted_score:.1f}/100.\n"
        f"Most influential variables according to the model (coefficient, sign and "
        f"magnitude): {features_text}.\n"
        f"{below_line}"
    )


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
    language: str = "fr",
) -> str:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise RecommendationError(
            "GROQ_API_KEY manquant : configurez-le dans .env pour activer les "
            "recommandations (clé gratuite sur console.groq.com/keys)."
        )

    english = language == "en"
    system_prompt = SYSTEM_PROMPT_EN if english else SYSTEM_PROMPT
    build_prompt = _build_user_prompt_en if english else _build_user_prompt

    model = os.getenv("GROQ_MODEL", DEFAULT_MODEL)
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": build_prompt(predicted_score, top_features, below_threshold),
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
