from fastapi import Request
from arq.connections import ArqRedis

def get_queue(request: Request) -> ArqRedis:
    return request.app.state.arq_redis