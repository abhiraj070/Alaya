import unittest
from datetime import datetime, timezone
import jwt
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.auth.jwt import SECRET_KEY, ALGORITHM
from app.db.connect import SessionLocal, engine, Base
from app.db.models import User, Knowledge, KnowledgeCoordinate, Embedding, EmbeddingKind, UploadedData, DataType
from app.main import app


def create_test_token(user_id: int) -> str:
    return jwt.encode({"user_id": user_id, "type": "access"}, SECRET_KEY, algorithm=ALGORITHM)


class TestUniverseBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        self.db = SessionLocal()
        ts = int(datetime.now(timezone.utc).timestamp() * 1000)

        # Create test users
        self.user_a = User(
            name="Alice Star",
            username=f"alice_{ts}",
            password="password123",
            refreshToken="",
        )
        self.user_b = User(
            name="Bob Star",
            username=f"bob_{ts}",
            password="password123",
            refreshToken="",
        )
        self.db.add_all([self.user_a, self.user_b])
        self.db.commit()
        self.db.refresh(self.user_a)
        self.db.refresh(self.user_b)

        self.token_a = create_test_token(self.user_a.id)
        self.token_b = create_test_token(self.user_b.id)

    def tearDown(self):
        try:
            self.db.rollback()
            for u in (self.user_a, self.user_b):
                user_rec = self.db.query(User).filter(User.id == u.id).first()
                if user_rec:
                    self.db.delete(user_rec)
            self.db.commit()
        except Exception:
            self.db.rollback()
        finally:
            self.db.close()

    def test_01_health_check(self):
        """Verify health check endpoint returns 200 and healthy status."""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

    def test_02_unauthorized_access(self):
        """Verify endpoints return 401 Unauthorized without JWT token."""
        res = self.client.get("/api/universe/nodes")
        self.assertEqual(res.status_code, 401)

        res = self.client.get("/api/universe/chunks/1")
        self.assertEqual(res.status_code, 401)

        res = self.client.post("/api/universe/recompute")
        self.assertEqual(res.status_code, 401)

    def test_03_empty_universe_nodes(self):
        """Verify user with zero knowledge chunks receives empty nodes list."""
        self.client.cookies.set("access_token", self.token_a)
        res = self.client.get("/api/universe/nodes")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["nodes"], [])
        self.assertEqual(data["total_stars"], 0)
        self.assertFalse(data["is_projected"])
        self.assertEqual(data["unprojected_count"], 0)

    def test_04_nodes_with_coordinates_and_source_lineage(self):
        """Verify nodes with coordinates and uploaded documents return rich metadata."""
        upload = UploadedData(
            data_type=DataType.DOCS,
            tag="pdf",
            data_source="https://res.cloudinary.com/alaya/docs/attention_is_all_you_need.pdf",
            user_id=self.user_a.id,
        )
        self.db.add(upload)
        self.db.commit()
        self.db.refresh(upload)

        k = Knowledge(
            user_id=self.user_a.id,
            text_content="Transformer models use self-attention to compute representations.",
            knowledge_metadata={"topic": "Transformers", "section": "1.1"},
            knowledge_type="deep_learning",
            uploaded_data_id=upload.id,
            chunk_index=0,
            page_number=3,
        )
        self.db.add(k)
        self.db.commit()
        self.db.refresh(k)

        coord = KnowledgeCoordinate(
            knowledge_id=k.id,
            x=12.5,
            y=-8.2,
            z=4.1,
            cluster_id=0,
            cluster_name="Neural Architectures",
        )
        self.db.add(coord)
        self.db.commit()

        self.client.cookies.set("access_token", self.token_a)
        res = self.client.get("/api/universe/nodes")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_stars"], 1)
        self.assertTrue(data["is_projected"])
        self.assertEqual(len(data["nodes"]), 1)

        node = data["nodes"][0]
        self.assertEqual(node["id"], k.id)
        self.assertAlmostEqual(node["x"], 12.5)
        self.assertAlmostEqual(node["y"], -8.2)
        self.assertAlmostEqual(node["z"], 4.1)
        self.assertEqual(node["cluster_id"], 0)
        self.assertEqual(node["cluster_name"], "Neural Architectures")
        self.assertEqual(node["source_type"], "docs")
        self.assertEqual(node["source_name"], "attention_is_all_you_need.pdf")
        self.assertTrue(node["has_source"])

    def test_05_cross_user_data_isolation(self):
        """Verify user B cannot view user A's knowledge chunks or nodes."""
        k = Knowledge(
            user_id=self.user_a.id,
            text_content="Alice's private secret note.",
            knowledge_metadata={},
            knowledge_type="private_note",
        )
        self.db.add(k)
        self.db.commit()
        self.db.refresh(k)

        # User B queries nodes -> should NOT see Alice's node
        self.client.cookies.set("access_token", self.token_b)
        res_nodes = self.client.get("/api/universe/nodes")
        self.assertEqual(res_nodes.status_code, 200)
        self.assertEqual(res_nodes.json()["total_stars"], 0)

        # User B tries to inspect Alice's chunk directly -> 404 Not Found
        res_chunk = self.client.get(f"/api/universe/chunks/{k.id}")
        self.assertEqual(res_chunk.status_code, 404)

        # User A inspects own chunk -> 200 OK
        self.client.cookies.set("access_token", self.token_a)
        res_chunk_a = self.client.get(f"/api/universe/chunks/{k.id}")
        self.assertEqual(res_chunk_a.status_code, 200)
        self.assertEqual(res_chunk_a.json()["id"], k.id)
        self.assertIn("Alice's private secret", res_chunk_a.json()["text_content"])


if __name__ == "__main__":
    unittest.main()
