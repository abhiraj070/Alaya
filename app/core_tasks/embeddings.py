from openai import AsyncOpenAI
from app.env_config.settings import get_settings

settings = get_settings()

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

MODEL = "text-embedding-3-small"

async def get_embedding(queries: list[str]) -> list[dict]:
    response = await client.embeddings.create(
        model=MODEL,
        input=queries,
    )
    return [
        {
            "subquery": queries[data.index],
            "vector": data.embedding,
        }
        for data in response.data
    ]
