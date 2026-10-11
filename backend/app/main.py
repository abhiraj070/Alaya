import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.api.messages import router as messages_router
from app.api.user import router as user_router
from app.core_tasks.arq_worker.arqRedis_init import create_redis_pool
from app.core_tasks.redis_pubsub.native_redis_init import create_redis_client


@asynccontextmanager
async def lifespan(app: FastAPI): #when the server starts this runs and redis gets created.
    from app.core_tasks.redis_pubsub.redis_pubsub import redis_listener
    #arqRedis
    app.state.arq_redis= await create_redis_pool()
    #native Redis
    app.state.native_redis = create_redis_client()
    #native redis used being used for pub/sub and arqRedis is kept only for the worker word
    listener_task = asyncio.create_task(
        redis_listener(app.state.native_redis)
    )
    try:
        yield
    finally:
        listener_task.cancel()
        await app.state.native_redis.aclose()
        await app.state.arq_redis.aclose()

app= FastAPI(title='Alaya', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins="http://localhost:3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")
app.include_router(messages_router, prefix="/api")
app.include_router(user_router, prefix="/api")
