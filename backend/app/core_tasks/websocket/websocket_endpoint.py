from fastapi.params import Depends

from app.auth.VerifyJWT import VerifyJWT
from app.main import app
from fastapi import WebSocket, WebSocketDisconnect
from starlette import status
from typing import Annotated

userid_to_ws={}
ALLOWED_WEBSOCKET_ORIGINS = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id:Annotated[int, Depends(VerifyJWT)]
):
    origin = websocket.headers.get("origin")
    if origin not in ALLOWED_WEBSOCKET_ORIGINS:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    userid_to_ws[user_id] = websocket

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        userid_to_ws.pop(user_id, None)
