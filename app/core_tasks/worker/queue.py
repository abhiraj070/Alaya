from arq import create_pool
from arq.connections import ArqRedis, RedisSettings
from fastapi import Request

from app.env_config.settings import get_settings

settings = get_settings()

redis_settings= RedisSettings(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
)

async def create_redis_pool() -> ArqRedis:
    return await create_pool(redis_settings)

def get_queue(request: Request) -> ArqRedis:
    return request.app.state.redis
