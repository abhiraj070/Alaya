from typing import Annotated
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.params import Depends
from starlette import status

from app.auth.VerifyJWT import VerifyJWT
from app.main import app

userid_to_ws = {}

ALLOWED_WEBSOCKET_ORIGINS = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
}


@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: Annotated[int, Depends(VerifyJWT)]
):
    origin = websocket.headers.get("origin")
    if origin and origin not in ALLOWED_WEBSOCKET_ORIGINS:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    userid_to_ws[user_id] = websocket
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if userid_to_ws.get(user_id) == websocket:
            userid_to_ws.pop(user_id, None)
