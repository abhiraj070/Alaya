from redis.asyncio import Redis
from app.env_config.settings import get_settings

settings = get_settings()


def create_redis_client() -> Redis:
    return Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        decode_responses=True,
    )