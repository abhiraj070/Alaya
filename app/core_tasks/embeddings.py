from openai import AsyncOpenAI
from app.env_config.settings import get_settings

settings = get_settings()

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

MODEL = "text-embedding-3-small"

async def get_embedding(text: str) -> list[float]:
    response = await client.embeddings.create(
        model=MODEL,
        input=text,
    )
    return response.data[0].embedding