import json
from typing import Annotated
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.params import Depends
from sqlalchemy import select
from starlette import status

from app.auth.VerifyJWT import VerifyJWT
from app.db.connect import SessionLocal
from app.db.model.uploaded_data import UploadedData
from app.main import app

userid_to_ws = {}
userid_to_universe = {}

ALLOWED_WEBSOCKET_ORIGINS = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}

def get_user_uploaded_data(user_id: int):
    with SessionLocal() as db:
        stmt = select(UploadedData).where(UploadedData.user_id == user_id).order_by(UploadedData.created_at.desc())
        records = db.execute(stmt).scalars().all()
        return [
            {
                "id": r.id,
                "data_type": r.data_type.value if hasattr(r.data_type, "value") else str(r.data_type),
                "tag": r.tag,
                "data_source": r.data_source,
                "user_id": r.user_id,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ]

async def send_universe_data(user_id: int):
    targets = userid_to_universe.get(user_id)
    if not targets:
        return
    socket_list = targets if isinstance(targets, list) else [targets]
    data = get_user_uploaded_data(user_id)
    payload = {"type": "uploaded_data", "data": data, "uploaded_data": data}
    for ws in list(socket_list):
        try:
            await ws.send_json(payload)
        except Exception:
            pass

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

    client_type = websocket.query_params.get("client")
    if not client_type and origin and ":5173" in origin:
        client_type = "universe"

    if client_type == "universe":
        if user_id not in userid_to_universe:
            userid_to_universe[user_id] = []
        userid_to_universe[user_id].append(websocket)
        data = get_user_uploaded_data(user_id)
        await websocket.send_json({"type": "uploaded_data", "data": data, "uploaded_data": data})
    else:
        userid_to_ws[user_id] = websocket

    try:
        while True:
            text = await websocket.receive_text()
            try:
                payload = json.loads(text)
            except Exception:
                payload = {}
            if isinstance(payload, dict):
                action = payload.get("action")
                if action in ("open_universe", "get_uploaded_data"):
                    await send_universe_data(user_id)
    except WebSocketDisconnect:
        if userid_to_ws.get(user_id) == websocket:
            userid_to_ws.pop(user_id, None)
        if user_id in userid_to_universe:
            if websocket in userid_to_universe[user_id]:
                userid_to_universe[user_id].remove(websocket)
            if not userid_to_universe[user_id]:
                userid_to_universe.pop(user_id, None)
