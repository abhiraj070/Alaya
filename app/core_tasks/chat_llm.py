from app.env_config.settings import get_settings
from openai import OpenAI

settings = get_settings()
PROVIDERS = {
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "api_key_env": "OPENAI_API_KEY",
        "model": "gpt-4o-mini",
    },
    "grok": {
        "base_url": "https://api.x.ai/v1",
        "api_key_env": "XAI_API_KEY",
        "model": "grok-3",
    },
}

config = PROVIDERS["openai"]
client = OpenAI(
    api_key=getattr(settings, config["api_key_env"]),
    base_url=config["base_url"],
)
MODEL = config["model"]
