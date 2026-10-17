from app.env_config.settings import get_settings
from openai import AsyncOpenAI

settings = get_settings()
PROVIDERS = {
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "api_key_env": "OPENAI_API_KEY",
        "model": settings.MODEL,
    },
    "grok": {
        "base_url": "https://api.x.ai/v1",
        "api_key_env": "XAI_API_KEY",
        "model": "grok-3",
    },
}

config = PROVIDERS["openai"]
client = AsyncOpenAI(
    api_key=getattr(settings, config["api_key_env"]),
    base_url=config["base_url"],
)
MODEL = config["model"]
VISION_MODEL = "gpt-5.6-luna"

def get_completion_options(model: str, max_tokens: int = 1024, temperature: float = 0.2) -> dict:
    options= {"max_completion_tokens": max_tokens}
    if model.startswith(("gpt-5", "gpt-6")):
        options["reasoning_effort"]= "none"
    else:
        options["temperature"]= temperature
    return options
