import json
from app.core_tasks.websocket.websocket_endpoint import userid_to_ws
async def redis_listener(redis):
    pubsub = redis.pubsub()

    await pubsub.subscribe("websocket_messages")

    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue

            data = json.loads(message["data"])
            websocket = userid_to_ws(data["user_id"])
            await websocket.send_json({"status":data["data"]["status"],"message":data["data"]["message"]})

    finally:
        await pubsub.unsubscribe("websocket_messages")
        await pubsub.close()