import asyncio
from datetime import datetime, timezone
import os
import unittest
from unittest.mock import AsyncMock, Mock, patch

with patch.dict(os.environ, {
    "DATABASE_URL": "postgresql+psycopg2://test:test@localhost/test",
    "SECRET_KEY": "test-secret-key-for-isolated-tests-only", "OPENAI_API_KEY": "test", "TYPESAFE_API_KEY": "test",
    "CLOUDINARY_CLOUD_NAME": "test", "CLOUDINARY_API_KEY": "test",
    "CLOUDINARY_API_SECRET": "test", "MODEL": "test",
}):
    from fastapi.testclient import TestClient
    from starlette.websockets import WebSocketDisconnect
    from app.main import app
    from app.auth.VerifyJWT import VerifyJWT
    from app.db.connect import get_db
    from app.core_tasks.websocket.websocket_endpoint import websocket_endpoint, userid_to_ws


class UniverseApiTests(unittest.TestCase):
    def setUp(self):
        self.db = Mock()
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[VerifyJWT] = lambda: 7
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()

    def test_only_uploads_and_token_routes_remain(self):
        paths = {path for path in app.openapi()["paths"] if path.startswith("/api/universe/")}
        self.assertEqual(paths, {"/api/universe/uploads", "/api/universe/token"})

    def test_single_upload_is_returned_without_knowledge_or_embeddings(self):
        self.db.execute.return_value.scalars.return_value.all.return_value = [{
            "id": 1, "user_id": 7, "data_type": "text", "tag": None,
            "data_source": "My memory", "created_at": datetime.now(timezone.utc),
        }]
        response = self.client.get("/api/universe/uploads")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["data_source"], "My memory")
        statement = self.db.execute.call_args.args[0]
        self.assertIn(7, statement.compile().params.values())

    def test_empty_uploads_and_authenticated_token(self):
        self.db.execute.return_value.scalars.return_value.all.return_value = []
        self.assertEqual(self.client.get("/api/universe/uploads").json(), [])
        response = self.client.get("/api/universe/token")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["token"])

    def test_uploads_require_authentication(self):
        app.dependency_overrides.pop(VerifyJWT)
        self.assertEqual(self.client.get("/api/universe/uploads").status_code, 401)
        self.db.execute.assert_not_called()

    def test_app_socket_keeps_status_notifications_without_upload_snapshots(self):
        socket = Mock(headers={"origin": "http://localhost:3000"})
        socket.accept = AsyncMock()
        socket.send_json = AsyncMock()

        async def receive():
            self.assertIs(userid_to_ws[7], socket)
            socket.send_json.assert_not_awaited()
            await userid_to_ws[7].send_json({"status": "completed", "message": "Data stored successfully"})
            raise WebSocketDisconnect()

        socket.receive_text = receive
        asyncio.run(websocket_endpoint(socket, 7))
        socket.accept.assert_awaited_once()
        socket.send_json.assert_awaited_once_with({"status": "completed", "message": "Data stored successfully"})
        self.assertNotIn(7, userid_to_ws)
