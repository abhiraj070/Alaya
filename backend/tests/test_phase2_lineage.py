import unittest
from datetime import datetime, timezone
import re

from app.db.connect import SessionLocal
from app.db.model.user import User
from app.db.model.chat import Knowledge, Embedding, EmbeddingKind
from app.db.model.universe import KnowledgeCoordinate
from app.db.model.uploaded_data import UploadedData, DataType


class TestPhase2SchemaAndLineage(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        self.unique_tag = f"test_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        self.user = User(
            name="Phase2 Test User",
            username=f"user_{self.unique_tag}",
            password="testpassword123",
            refreshToken="",
        )
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.user)

    def tearDown(self):
        try:
            self.db.rollback()
            user = self.db.query(User).filter(User.id == self.user.id).first()
            if user:
                self.db.delete(user)
                self.db.commit()
        except Exception:
            self.db.rollback()
        finally:
            self.db.close()

    def test_01_uploaded_document_lineage_and_chunk_order(self):
        """Verify uploaded documents retain upload ID, chunks link to upload, and chunk_index is persisted."""
        upload = UploadedData(
            data_type=DataType.DOCS,
            tag="pdf",
            data_source="https://res.cloudinary.com/alaya/docs/report_123.pdf",
            user_id=self.user.id,
        )
        self.db.add(upload)
        self.db.commit()
        self.db.refresh(upload)

        # Create sequential chunks
        chunks = []
        for i in range(3):
            k = Knowledge(
                text_content=f"Document chunk content section {i}",
                user_id=self.user.id,
                knowledge_metadata={"section": i},
                knowledge_type="document_section",
                uploaded_data_id=upload.id,
                chunk_index=i,
                page_number=1 if i < 2 else 2,
            )
            self.db.add(k)
            chunks.append(k)
        self.db.commit()

        # Query back and verify relationships and chunk ordering
        saved_chunks = (
            self.db.query(Knowledge)
            .filter(Knowledge.uploaded_data_id == upload.id)
            .order_by(Knowledge.chunk_index.asc())
            .all()
        )
        self.assertEqual(len(saved_chunks), 3)
        for idx, sc in enumerate(saved_chunks):
            self.assertEqual(sc.uploaded_data_id, upload.id)
            self.assertEqual(sc.chunk_index, idx)
            self.assertEqual(sc.uploaded_data.id, upload.id)
            self.assertEqual(sc.user_id, self.user.id)

        # Verify back_populates relationship
        self.db.refresh(upload)
        self.assertEqual(len(upload.knowledge), 3)

    def test_02_pdf_page_tracking_logic(self):
        """Verify that page numbers are accurately tracked from PDF markers across chunk boundaries."""
        sample_chunks = [
            "[Page 1]\nFirst sentence of page one.",
            "Continuation of page one content.",
            "Ending sentence of page one.\n\n[Page 2]\nBeginning of page two.",
            "Second paragraph on page two.",
            "[Page 3]\nImmediate start of page three.",
        ]

        chunk_pages = []
        current_page = 1
        for chunk in sample_chunks:
            page_markers = list(re.finditer(r'\[Page\s+(\d+)\]', chunk))
            if page_markers:
                first_marker = page_markers[0]
                if first_marker.start() == 0 or not chunk[:first_marker.start()].strip():
                    chunk_page = int(first_marker.group(1))
                else:
                    chunk_page = current_page
                current_page = int(page_markers[-1].group(1))
            else:
                chunk_page = current_page
            chunk_pages.append(chunk_page)

        self.assertEqual(chunk_pages, [1, 1, 1, 2, 3])

    def test_03_direct_natural_language_knowledge_without_document(self):
        """Verify direct natural-language knowledge preserves nullable uploaded_data_id."""
        direct_k = Knowledge(
            text_content="Direct personal fact: I like espresso",
            user_id=self.user.id,
            knowledge_metadata={"preference": "espresso"},
            knowledge_type="preference",
            uploaded_data_id=None,
            chunk_index=0,
            page_number=None,
        )
        self.db.add(direct_k)
        self.db.commit()
        self.db.refresh(direct_k)

        self.assertIsNone(direct_k.uploaded_data_id)
        self.assertIsNone(direct_k.uploaded_data)
        self.assertIsNone(direct_k.page_number)
        self.assertEqual(direct_k.chunk_index, 0)

    def test_04_image_derived_knowledge_lineage(self):
        """Verify image-derived knowledge retains link to its UploadedData record."""
        image_upload = UploadedData(
            data_type=DataType.IMG,
            tag="png",
            data_source="https://res.cloudinary.com/alaya/images/receipt_456.png",
            user_id=self.user.id,
        )
        self.db.add(image_upload)
        self.db.commit()
        self.db.refresh(image_upload)

        image_k = Knowledge(
            text_content="Receipt description: Grocery bill for 45 USD",
            user_id=self.user.id,
            knowledge_metadata={"store": "Market", "amount": 45},
            knowledge_type="purchase",
            uploaded_data_id=image_upload.id,
            chunk_index=0,
            page_number=None,
        )
        self.db.add(image_k)
        self.db.commit()
        self.db.refresh(image_k)

        self.assertEqual(image_k.uploaded_data_id, image_upload.id)
        self.assertEqual(image_k.uploaded_data.data_type, DataType.IMG)
        self.assertEqual(image_k.uploaded_data.data_source, image_upload.data_source)

    def test_05_embeddings_reference_knowledge_records(self):
        """Verify embeddings link properly to knowledge records and preserve 1536-D vector."""
        k = Knowledge(
            text_content="Embedded knowledge record",
            user_id=self.user.id,
            knowledge_metadata={"topic": "test"},
            knowledge_type="fact",
            uploaded_data_id=None,
            chunk_index=0,
            page_number=None,
        )
        self.db.add(k)
        self.db.flush()

        test_vector = [0.01 * (j % 50) for j in range(1536)]
        emb = Embedding(
            knowledge_id=k.id,
            kind=EmbeddingKind.KNOWLEDGE,
            embedded_text=k.text_content,
            seq=0,
            vector=test_vector,
        )
        self.db.add(emb)
        self.db.commit()

        self.db.refresh(k)
        self.assertEqual(len(k.embeddings), 1)
        self.assertEqual(k.embeddings[0].knowledge_id, k.id)
        self.assertEqual(len(k.embeddings[0].vector), 1536)

    def test_06_upload_deletion_set_null_behavior(self):
        """Verify that deleting an UploadedData record sets uploaded_data_id to NULL on Knowledge without deleting the chunk."""
        upload = UploadedData(
            data_type=DataType.DOCS,
            tag="docx",
            data_source="https://res.cloudinary.com/alaya/docs/temporary_doc.docx",
            user_id=self.user.id,
        )
        self.db.add(upload)
        self.db.commit()
        self.db.refresh(upload)
        upload_id = upload.id

        k = Knowledge(
            text_content="Valuable extracted knowledge from docx",
            user_id=self.user.id,
            knowledge_metadata={"topic": "architecture"},
            knowledge_type="note",
            uploaded_data_id=upload_id,
            chunk_index=0,
            page_number=None,
        )
        self.db.add(k)
        self.db.commit()
        self.db.refresh(k)
        knowledge_id = k.id

        # Delete the upload
        self.db.delete(upload)
        self.db.commit()

        # Re-fetch Knowledge chunk
        preserved_k = self.db.query(Knowledge).filter(Knowledge.id == knowledge_id).first()
        self.assertIsNotNone(preserved_k, "Knowledge chunk must NOT be deleted when upload is deleted")
        self.assertIsNone(preserved_k.uploaded_data_id, "uploaded_data_id must be SET NULL on delete")

    def test_07_knowledge_deletion_cascades_to_coordinates(self):
        """Verify that deleting a Knowledge record cascades to delete its KnowledgeCoordinate record."""
        k = Knowledge(
            text_content="Star coordinate knowledge record",
            user_id=self.user.id,
            knowledge_metadata={"celestial": True},
            knowledge_type="concept",
            uploaded_data_id=None,
            chunk_index=0,
            page_number=None,
        )
        self.db.add(k)
        self.db.flush()

        coord = KnowledgeCoordinate(
            knowledge_id=k.id,
            x=10.5,
            y=-4.2,
            z=18.9,
            cluster_id=3,
            cluster_name="Science",
        )
        self.db.add(coord)
        self.db.commit()

        self.db.refresh(k)
        self.assertIsNotNone(k.coordinate)
        self.assertEqual(k.coordinate.x, 10.5)
        self.assertEqual(k.coordinate.cluster_name, "Science")

        # Delete Knowledge
        knowledge_id = k.id
        self.db.delete(k)
        self.db.commit()

        # Coordinate must be gone
        orphan_coord = self.db.query(KnowledgeCoordinate).filter(KnowledgeCoordinate.knowledge_id == knowledge_id).first()
        self.assertIsNone(orphan_coord, "KnowledgeCoordinate must be cascaded on Knowledge deletion")

    def test_08_backward_compatibility_existing_records(self):
        """Verify that records with nullable fields work seamlessly in all queries."""
        k = Knowledge(
            text_content="Legacy knowledge record before Phase 2",
            user_id=self.user.id,
            knowledge_metadata={"legacy": True},
            knowledge_type="legacy_fact",
        )
        self.db.add(k)
        self.db.commit()
        self.db.refresh(k)

        self.assertIsNone(k.uploaded_data_id)
        self.assertIsNone(k.chunk_index)
        self.assertIsNone(k.page_number)
        self.assertIsNone(k.coordinate)


if __name__ == "__main__":
    unittest.main()
