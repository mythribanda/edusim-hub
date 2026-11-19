import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "google/gemini-2.5-flash"
FALLBACK_MODELS = [
    "google/gemini-2.5-flash-lite",
]

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "").strip()

# Configurable Token Limits
DEFAULT_MAX_TOKENS = int(os.getenv("DEFAULT_MAX_TOKENS", "1500"))
TUTOR_MAX_TOKENS = int(os.getenv("TUTOR_MAX_TOKENS", "1500"))
RELEVANCE_MAX_TOKENS = int(os.getenv("RELEVANCE_MAX_TOKENS", "20"))
SUMMARY_MAX_TOKENS = int(os.getenv("SUMMARY_MAX_TOKENS", "150"))
SIMULATION_MAX_TOKENS = int(os.getenv("SIMULATION_MAX_TOKENS", "2500"))

# Configurable Timeout, Deadline, & Retry Settings
OPENROUTER_TIMEOUT_SECONDS = float(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "25.0"))
OPENROUTER_TOTAL_DEADLINE_SECONDS = float(os.getenv("OPENROUTER_TOTAL_DEADLINE_SECONDS", "45.0"))
OPENROUTER_MAX_RETRIES = int(os.getenv("OPENROUTER_MAX_RETRIES", "1"))
OPENROUTER_RETRY_BUDGET = int(os.getenv("OPENROUTER_RETRY_BUDGET", "2"))
OPENROUTER_RETRY_BACKOFF_BASE = float(os.getenv("OPENROUTER_RETRY_BACKOFF_BASE", "1.0"))
OPENROUTER_RETRY_BACKOFF_MAX = float(os.getenv("OPENROUTER_RETRY_BACKOFF_MAX", "4.0"))


def _split_model_list(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def get_primary_model() -> str:
    return OPENROUTER_MODEL or DEFAULT_MODEL


def get_model_chain() -> list[str]:
    primary = get_primary_model()
    chain: list[str] = [primary]
    env_fallbacks = _split_model_list(os.getenv("OPENROUTER_FALLBACK_MODELS"))
    if env_fallbacks:
        chain.extend(env_fallbacks)
    else:
        chain.extend(FALLBACK_MODELS)

    deduped: list[str] = []
    seen: set[str] = set()
    for model in chain:
        if model and model not in seen:
            seen.add(model)
            deduped.append(model)
    return deduped
