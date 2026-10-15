import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone
from types import SimpleNamespace
from fastapi.testclient import TestClient
import jwt
from starlette.testclient import WebSocketDenialResponse

from app.main import app
from app.env_config.settings import get_settings
from app.core_tasks.websocket.websocket_endpoint import (
    userid_to_ws,
    userid_to_universe,
    get_user_uploaded_data,
    send_universe_data,
)
from app.db.model.uploaded_data import DataType

class WebSocketTests(unittest.TestCase):
    def setUp(self):
        self.settings = get_settings()
        self.user_id = 42
        self.token = jwt.encode(
            {"user_id": self.user_id, "type": "access"},
            self.settings.SECRET_KEY,
            algorithm="HS256"
        )
        userid_to_ws.clear()
        userid_to_universe.clear()

    def test_unauthenticated_connection_rejected(self):
        client = TestClient(app)
        with self.assertRaises((WebSocketDenialResponse, Exception)):
            with client.websocket_connect("/ws"):
                pass

    def test_invalid_origin_rejected(self):
        client = TestClient(app, cookies={"access_token": self.token})
        with self.assertRaises(Exception):
            with client.websocket_connect("/ws", headers={"origin": "http://malicious-site.com"}):
                pass

    @patch("app.core_tasks.websocket.websocket_endpoint.get_user_uploaded_data")
    def test_app_client_registers_connection(self, mock_get_data):
        client = TestClient(app, cookies={"access_token": self.token})
        with client.websocket_connect("/ws?client=app", headers={"origin": "http://localhost:3000"}):
            self.assertIn(self.user_id, userid_to_ws)
        self.assertNotIn(self.user_id, userid_to_ws)

    @patch("app.core_tasks.websocket.websocket_endpoint.get_user_uploaded_data")
    def test_universe_client_receives_uploaded_data_on_connect(self, mock_get_data):
        mock_data = [
            {"id": 1, "data_type": "docs", "tag": "pdf", "data_source": "test.pdf", "user_id": self.user_id, "created_at": "2026-10-15T00:00:00"}
        ]
        mock_get_data.return_value = mock_data

        client = TestClient(app, cookies={"access_token": self.token})
        with client.websocket_connect("/ws?client=universe", headers={"origin": "http://localhost:5173"}) as ws:
            self.assertIn(self.user_id, userid_to_universe)
            msg = ws.receive_json()
            self.assertEqual(msg["type"], "uploaded_data")
            self.assertEqual(msg["data"], mock_data)
        self.assertNotIn(self.user_id, userid_to_universe)

    @patch("app.core_tasks.websocket.websocket_endpoint.get_user_uploaded_data")
    def test_open_universe_action_sends_data_to_universe(self, mock_get_data):
        mock_data = [
            {"id": 2, "data_type": "img", "tag": "png", "data_source": "test.png", "user_id": self.user_id, "created_at": "2026-10-15T00:00:00"}
        ]
        mock_get_data.return_value = mock_data

        client = TestClient(app, cookies={"access_token": self.token})
        with client.websocket_connect("/ws?client=app", headers={"origin": "http://localhost:3000"}) as ws_app:
            with client.websocket_connect("/ws?client=universe", headers={"origin": "http://localhost:5173"}) as ws_uni:
                initial = ws_uni.receive_json()
                self.assertEqual(initial["type"], "uploaded_data")

                ws_app.send_json({"action": "open_universe"})
                triggered = ws_uni.receive_json()
                self.assertEqual(triggered["type"], "uploaded_data")
                self.assertEqual(triggered["data"], mock_data)

    def test_get_user_uploaded_data_filters_by_user_id(self):
        mock_records = [
            SimpleNamespace(
                id=10,
                data_type=DataType.DOCS,
                tag="report",
                data_source="doc.pdf",
                user_id=self.user_id,
                created_at=datetime(2026, 10, 15, 12, 0, 0, tzinfo=timezone.utc),
            )
        ]
        with patch("app.core_tasks.websocket.websocket_endpoint.SessionLocal") as mock_session_local:
            mock_session = MagicMock()
            mock_session_local.return_value.__enter__.return_value = mock_session
            mock_session.execute.return_value.scalars.return_value.all.return_value = mock_records

            data = get_user_uploaded_data(self.user_id)
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]["id"], 10)
            self.assertEqual(data[0]["data_type"], "docs")
            self.assertEqual(data[0]["user_id"], self.user_id)

            stmt = mock_session.execute.call_args.args[0]
            compiled = stmt.compile()
            self.assertIn("uploaded_data.user_id =", str(compiled))
