import unittest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.api.user import generate_tokens
from app.core_tasks.arq_worker.get_queue import get_queue
from app.core_tasks.universe.projection_service import project_user_knowledge
from app.db.connect import SessionLocal
from app.db.model.chat import Embedding, EmbeddingKind, Knowledge, KnowledgeCoordinate
from app.db.model.uploaded_data import DataType, UploadedData
from app.db.model.user import User
from app.main import app


class MockQueue:
    def __init__(self):
        self.enqueued = []
        self.keys = {}

    async def set(self, key, value, ex=None, nx=False):
        if nx and key in self.keys:
            return False
        self.keys[key] = value
        return True

    async def enqueue_job(self, function_name, *args, **kwargs):
        class MockJob:
            job_id = "mock_job_123"
        self.enqueued.append((function_name, args, kwargs))
        return MockJob()


class TestPhase3Universe(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        self.db = SessionLocal()
        self.mock_queue = MockQueue()
        app.dependency_overrides[get_queue] = lambda: self.mock_queue
        ts = int(datetime.now(timezone.utc).timestamp() * 1000)

        # Create primary test user A
        self.user_a = User(
            name="Alice Universe",
            username=f"alice_{ts}",
            password="alicepassword123",
            refreshToken="",
        )
        # Create secondary test user B for isolation testing
        self.user_b = User(
            name="Bob Universe",
            username=f"bob_{ts}",
            password="bobpassword123",
            refreshToken="",
        )
        self.db.add_all([self.user_a, self.user_b])
        self.db.commit()
        self.db.refresh(self.user_a)
        self.db.refresh(self.user_b)

        # Generate auth tokens
        tokens_a = generate_tokens(self.user_a.id)
        self.token_a = tokens_a["access_token"]
        self.headers_a = {"Authorization": f"Bearer {self.token_a}"}

        tokens_b = generate_tokens(self.user_b.id)
        self.token_b = tokens_b["access_token"]
        self.headers_b = {"Authorization": f"Bearer {self.token_b}"}

    def tearDown(self):
        app.dependency_overrides.clear()
        try:
            self.db.rollback()
            for u in (self.user_a, self.user_b):
                user_obj = self.db.query(User).filter(User.id == u.id).first()
                if user_obj:
                    self.db.delete(user_obj)
            self.db.commit()
        except Exception:
            self.db.rollback()
        finally:
            self.db.close()

    def _create_knowledge_with_embedding(self, user_id: int, text: str, k_type: str = "fact", uploaded_data_id=None, chunk_index=None, page_number=None, vector_seed=0):
        k = Knowledge(
            text_content=text,
            user_id=user_id,
            knowledge_metadata={"topic": "test", "seed": vector_seed},
            knowledge_type=k_type,
            uploaded_data_id=uploaded_data_id,
            chunk_index=chunk_index,
            page_number=page_number,
        )
        self.db.add(k)
        self.db.flush()

        # Deterministic 1,536-D pseudo-vector
        vec = [float((vector_seed + j) % 100) / 100.0 for j in range(1536)]
        emb = Embedding(
            knowledge_id=k.id,
            kind=EmbeddingKind.KNOWLEDGE,
            embedded_text=text,
            seq=0,
            vector=vec,
        )
        self.db.add(emb)
        self.db.commit()
        self.db.refresh(k)
        return k

    def test_01_empty_and_small_dataset_projection(self):
        """Verify UMAP projection handles 0, 1, and small dataset counts safely with deterministic fallbacks."""
        # 0 items
        res_0 = project_user_knowledge(self.user_a.id, db=self.db)
        self.assertEqual(res_0["status"], "empty")
        self.assertEqual(res_0["count"], 0)

        # 1 item
        k1 = self._create_knowledge_with_embedding(self.user_a.id, "Single star knowledge item", vector_seed=1)
        res_1 = project_user_knowledge(self.user_a.id, db=self.db)
        self.assertEqual(res_1["status"], "completed")
        self.assertEqual(res_1["count"], 1)

        coord_1 = self.db.query(KnowledgeCoordinate).filter(KnowledgeCoordinate.knowledge_id == k1.id).first()
        self.assertIsNotNone(coord_1)
        self.assertEqual(coord_1.x, 0.0)
        self.assertEqual(coord_1.y, 0.0)
        self.assertEqual(coord_1.z, 0.0)

    def test_02_umap_multidimensional_projection_and_persistence(self):
        """Verify UMAP projects 6+ chunks into 3D coordinates and clusters them in PostgreSQL."""
        chunks = []
        for i in range(6):
            k = self._create_knowledge_with_embedding(
                self.user_a.id,
                f"Knowledge chunk number {i} discussing machine learning and neural architectures.",
                k_type="ml_concept",
                vector_seed=i * 10,
            )
            chunks.append(k)

        res = project_user_knowledge(self.user_a.id, db=self.db)
        self.assertEqual(res["status"], "completed")
        self.assertEqual(res["count"], 6)

        coords = (
            self.db.query(KnowledgeCoordinate)
            .join(Knowledge)
            .filter(Knowledge.user_id == self.user_a.id)
            .all()
        )
        self.assertEqual(len(coords), 6)
        for c in coords:
            self.assertIsInstance(c.x, float)
            self.assertIsInstance(c.y, float)
            self.assertIsInstance(c.z, float)
            self.assertIsNotNone(c.cluster_id)
            self.assertTrue(c.cluster_name.startswith("Sector"))

    def test_03_get_nodes_endpoint_auth_and_structure(self):
        """Verify GET /api/universe/nodes returns formatted stars without exposing raw vectors."""
        # Create an upload doc and linked chunk
        doc = UploadedData(
            data_type=DataType.DOCS,
            tag="pdf",
            data_source="https://res.cloudinary.com/demo/annual_report.pdf",
            user_id=self.user_a.id,
        )
        self.db.add(doc)
        self.db.commit()

        k = self._create_knowledge_with_embedding(
            self.user_a.id,
            "Annual revenue reached 1.2 million USD with 25% profit margin.",
            k_type="financial",
            uploaded_data_id=doc.id,
            chunk_index=0,
            page_number=3,
            vector_seed=5,
        )
        project_user_knowledge(self.user_a.id, db=self.db)

        # Unauthenticated request -> 401
        res_unauth = self.client.get("/api/universe/nodes")
        self.assertEqual(res_unauth.status_code, 401)

        # Authenticated request
        res = self.client.get("/api/universe/nodes", headers=self.headers_a)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["total_stars"], 1)
        self.assertTrue(data["is_projected"])
        self.assertEqual(len(data["nodes"]), 1)

        node = data["nodes"][0]
        self.assertEqual(node["id"], k.id)
        self.assertIn("revenue", node["preview"].lower())
        self.assertEqual(node["source_type"], "docs")
        self.assertTrue(node["has_source"])
        self.assertEqual(node["source_name"], "annual_report.pdf")
        self.assertIn("x", node)
        self.assertIn("y", node)
        self.assertIn("z", node)

        # CRITICAL SECURITY CHECK: Ensure vector is never exposed
        self.assertNotIn("vector", node)
        self.assertNotIn("embedding", node)

    def test_04_get_chunk_detail_and_multiuser_isolation(self):
        """Verify GET /api/universe/chunk/{id} returns full detail and enforces strict user isolation."""
        doc = UploadedData(
            data_type=DataType.DOCS,
            tag="docx",
            data_source="https://res.cloudinary.com/demo/confidential_project.docx",
            user_id=self.user_a.id,
        )
        self.db.add(doc)
        self.db.commit()

        k_a = self._create_knowledge_with_embedding(
            self.user_a.id,
            "Confidential project blueprint for User A only.",
            k_type="blueprint",
            uploaded_data_id=doc.id,
            chunk_index=1,
            page_number=None,
            vector_seed=9,
        )

        # User A requests their own chunk -> 200 OK
        res_a = self.client.get(f"/api/universe/chunk/{k_a.id}", headers=self.headers_a)
        self.assertEqual(res_a.status_code, 200)
        data_a = res_a.json()
        self.assertEqual(data_a["id"], k_a.id)
        self.assertEqual(data_a["text_content"], "Confidential project blueprint for User A only.")
        self.assertEqual(data_a["chunk_index"], 1)
        self.assertIsNotNone(data_a["source"])
        self.assertEqual(data_a["source"]["data_type"], "docs")
        self.assertNotIn("vector", data_a)

        # User B attempts to access User A's chunk -> 404 NOT FOUND (Isolation!)
        res_b = self.client.get(f"/api/universe/chunk/{k_a.id}", headers=self.headers_b)
        self.assertEqual(res_b.status_code, 404)

        # User B requests nodes -> only User B's nodes (0 stars)
        res_nodes_b = self.client.get("/api/universe/nodes", headers=self.headers_b)
        self.assertEqual(res_nodes_b.status_code, 200)
        self.assertEqual(res_nodes_b.json()["total_stars"], 0)

    def test_05_recompute_endpoint(self):
        """Verify POST /api/universe/recompute accepts requests and enqueues background job."""
        res = self.client.post("/api/universe/recompute", headers=self.headers_a)
        self.assertEqual(res.status_code, 202)
        data = res.json()
        self.assertEqual(data["status"], "accepted")
        self.assertEqual(len(self.mock_queue.enqueued), 1)
        self.assertEqual(self.mock_queue.enqueued[0][0], "calculate_universe_coordinates")
        self.assertEqual(self.mock_queue.enqueued[0][1], (self.user_a.id,))


if __name__ == "__main__":
    unittest.main()
