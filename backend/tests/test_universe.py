"""Universe contract checks using in-memory records; no database or Redis needed."""

import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import HTTPException
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import configure_mappers

from app.api.universe import get_chunk_detail, get_universe_nodes, recompute_coordinates
from app.core_tasks.projection.projection_service import project_user_knowledge
from app.db.connect import Base
from app.db.model import KnowledgeCoordinate


class UniverseTests(unittest.TestCase):
    def test_single_coordinate_model_and_relationship(self):
        configure_mappers()
        self.assertIs(Base.metadata.tables["knowledge_coordinates"], KnowledgeCoordinate.__table__)
        self.assertEqual(list(KnowledgeCoordinate.__table__.primary_key.columns.keys()), ["knowledge_id"])
        self.assertEqual(KnowledgeCoordinate.knowledge.property.back_populates, "coordinate")

    def test_snapshot_counts_only_projected_nodes_without_writing(self):
        db = MagicMock()
        records = [
            SimpleNamespace(
                id=index, coordinate=coordinate, text_content="A useful memory",
                knowledge_metadata={"title": "My memory"}, knowledge_type="fact",
                uploaded_data=None, created_at=datetime.now(timezone.utc),
            )
            for index, coordinate in enumerate([
                SimpleNamespace(x=1, y=2, z=3, cluster_id=0, cluster_name="Sector 0"), None,
            ], start=1)
        ]
        db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = records
        with patch("app.api.universe.project_user_knowledge") as project:
            snapshot = get_universe_nodes(7, db)
        self.assertEqual(snapshot.total_stars, 2)
        self.assertEqual(snapshot.unprojected_count, 1)
        self.assertEqual([node.id for node in snapshot.nodes], [1])
        self.assertFalse(snapshot.nodes[0].has_source)
        project.assert_not_called()
        db.commit.assert_not_called()
        statement = db.execute.call_args.args[0]
        self.assertEqual(statement.whereclause.compile().params["user_id_1"], 7)

    def test_missing_or_unowned_detail_is_not_found(self):
        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.return_value = None
        with self.assertRaises(HTTPException) as caught:
            get_chunk_detail(42, 7, db)
        self.assertEqual(caught.exception.status_code, 404)
        parameters = db.execute.call_args.args[0].whereclause.compile().params
        self.assertEqual(parameters["id_1"], 42)
        self.assertEqual(parameters["user_id_1"], 7)

    def test_small_projection_reuses_existing_coordinates_and_commits(self):
        db = MagicMock()
        existing = KnowledgeCoordinate(knowledge_id=10, x=99, y=99, z=99)
        embeddings = MagicMock()
        embeddings.all.return_value = [(10, [1.0, 0.0]), (11, [0.0, 1.0])]
        coordinates = MagicMock()
        coordinates.scalars.return_value.all.return_value = [existing]
        db.execute.side_effect = [embeddings, coordinates]
        result = project_user_knowledge(7, db)
        self.assertEqual(result["count"], 2)
        self.assertEqual(existing.x, -15.0)
        added = db.add.call_args.args[0]
        self.assertEqual(added.knowledge_id, 11)
        self.assertEqual(added.x, 15.0)
        db.commit.assert_called_once()
        db.close.assert_not_called()
        statement = db.execute.call_args_list[0].args[0]
        sql = str(statement.compile(dialect=postgresql.dialect()))
        self.assertIn("DISTINCT ON (knowledge.id)", sql)

    def test_failed_projection_rolls_back(self):
        db = MagicMock()
        db.execute.side_effect = RuntimeError("Database unavailable")
        with self.assertRaises(RuntimeError):
            project_user_knowledge(7, db)
        db.rollback.assert_called_once()
        db.commit.assert_not_called()

    def test_recompute_returns_completed_only_after_projection(self):
        db = MagicMock()
        with patch("app.api.universe.project_user_knowledge", return_value={"count": 3}) as project:
            result = recompute_coordinates(7, db)
        project.assert_called_once_with(7, db=db)
        self.assertEqual(result.status, "completed")
        self.assertEqual(result.total_nodes, 3)


    def test_scenario_1_user_has_only_document_knowledge(self):
        db = MagicMock()
        source = SimpleNamespace(id=1, data_type=SimpleNamespace(value="docs"), data_source="https://res.cloudinary.com/demo/raw/upload/paper.pdf")
        coord = SimpleNamespace(x=10.0, y=20.0, z=30.0, cluster_id=0, cluster_name="Sector 0")
        record = SimpleNamespace(
            id=1, coordinate=coord, text_content="Attention mechanism chunk",
            knowledge_metadata={"title": "Attention"}, knowledge_type="document",
            uploaded_data=source, created_at=datetime.now(timezone.utc),
        )
        db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = [record]
        snapshot = get_universe_nodes(7, db)
        self.assertEqual(len(snapshot.nodes), 1)
        node = snapshot.nodes[0]
        self.assertEqual(node.source_type, "docs")
        self.assertEqual(node.content_type, "docs")
        self.assertTrue(node.has_source)
        self.assertEqual(node.source_name, "paper.pdf")

    def test_scenario_2_user_has_only_image_knowledge(self):
        db = MagicMock()
        source = SimpleNamespace(id=2, data_type=SimpleNamespace(value="img"), data_source="https://res.cloudinary.com/demo/image/upload/diagram.png")
        coord = SimpleNamespace(x=-5.0, y=15.0, z=-10.0, cluster_id=1, cluster_name="Sector 1")
        record = SimpleNamespace(
            id=2, coordinate=coord, text_content="Architecture diagram showing encoder and decoder",
            knowledge_metadata={"title": "Architecture Diagram"}, knowledge_type="diagram",
            uploaded_data=source, created_at=datetime.now(timezone.utc),
        )
        db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = [record]
        snapshot = get_universe_nodes(7, db)
        self.assertEqual(len(snapshot.nodes), 1)
        node = snapshot.nodes[0]
        self.assertEqual(node.source_type, "img")
        self.assertEqual(node.content_type, "img")
        self.assertTrue(node.has_source)
        self.assertEqual(node.source_name, "diagram.png")

    def test_scenario_3_user_has_only_direct_text_knowledge(self):
        db = MagicMock()
        coord = SimpleNamespace(x=0.0, y=0.0, z=0.0, cluster_id=0, cluster_name="Sector 0")
        record = SimpleNamespace(
            id=3, coordinate=coord, text_content="Direct memory entry about machine learning",
            knowledge_metadata={"title": "ML Notes"}, knowledge_type="fact",
            uploaded_data=None, created_at=datetime.now(timezone.utc),
        )
        db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = [record]
        snapshot = get_universe_nodes(7, db)
        self.assertEqual(len(snapshot.nodes), 1)
        node = snapshot.nodes[0]
        self.assertEqual(node.source_type, "text")
        self.assertEqual(node.content_type, "text")
        self.assertFalse(node.has_source)
        self.assertIsNone(node.source_name)

    def test_scenario_4_user_has_all_three_types_mixed_in_shared_projection(self):
        db = MagicMock()
        doc_source = SimpleNamespace(id=1, data_type=SimpleNamespace(value="docs"), data_source="https://res.cloudinary.com/demo/raw/upload/manual.pdf")
        img_source = SimpleNamespace(id=2, data_type=SimpleNamespace(value="img"), data_source="https://res.cloudinary.com/demo/image/upload/figure.png")
        records = [
            SimpleNamespace(
                id=1, coordinate=SimpleNamespace(x=1.0, y=2.0, z=3.0, cluster_id=0, cluster_name="Sector 0"),
                text_content="Document chunk", knowledge_metadata={"title": "Doc"}, knowledge_type="document",
                uploaded_data=doc_source, created_at=datetime.now(timezone.utc),
            ),
            SimpleNamespace(
                id=2, coordinate=SimpleNamespace(x=4.0, y=5.0, z=6.0, cluster_id=0, cluster_name="Sector 0"),
                text_content="Image description", knowledge_metadata={"title": "Img"}, knowledge_type="diagram",
                uploaded_data=img_source, created_at=datetime.now(timezone.utc),
            ),
            SimpleNamespace(
                id=3, coordinate=SimpleNamespace(x=7.0, y=8.0, z=9.0, cluster_id=1, cluster_name="Sector 1"),
                text_content="Direct text note", knowledge_metadata={"title": "Note"}, knowledge_type="note",
                uploaded_data=None, created_at=datetime.now(timezone.utc),
            ),
        ]
        db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = records
        snapshot = get_universe_nodes(7, db)
        self.assertEqual(snapshot.total_stars, 3)
        self.assertEqual(snapshot.unprojected_count, 0)
        self.assertTrue(snapshot.is_projected)
        types = [node.source_type for node in snapshot.nodes]
        self.assertEqual(types, ["docs", "img", "text"])

    def test_scenario_5_semantically_similar_embeddings_across_content_types(self):
        db = MagicMock()
        # Document chunk and image description have identical semantic vectors
        similar_vector = [0.7071, 0.7071]
        embeddings = MagicMock()
        embeddings.all.return_value = [(101, similar_vector), (102, similar_vector)]
        coordinates = MagicMock()
        coordinates.scalars.return_value.all.return_value = []
        db.execute.side_effect = [embeddings, coordinates]

        result = project_user_knowledge(7, db)
        self.assertEqual(result["count"], 2)
        added_coords = [call.args[0] for call in db.add.call_args_list]
        self.assertEqual(len(added_coords), 2)
        # Both are projected in the same shared 3D celestial space
        self.assertEqual(added_coords[0].knowledge_id, 101)
        self.assertEqual(added_coords[1].knowledge_id, 102)
        self.assertAlmostEqual(added_coords[0].x, -15.0)
        self.assertAlmostEqual(added_coords[1].x, 15.0)

    def test_scenario_6_record_with_embedding_but_no_saved_coordinates(self):
        db = MagicMock()
        records = [
            SimpleNamespace(
                id=1, coordinate=SimpleNamespace(x=1, y=2, z=3, cluster_id=0, cluster_name="Sector 0"),
                text_content="Memory with coords", knowledge_metadata={}, knowledge_type="fact",
                uploaded_data=None, created_at=datetime.now(timezone.utc),
            ),
            SimpleNamespace(
                id=2, coordinate=None,
                text_content="Newly ingested memory without coords yet", knowledge_metadata={}, knowledge_type="fact",
                uploaded_data=None, created_at=datetime.now(timezone.utc),
            ),
        ]
        db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = records
        snapshot = get_universe_nodes(7, db)
        self.assertEqual(snapshot.total_stars, 2)
        self.assertEqual(snapshot.unprojected_count, 1)
        self.assertFalse(snapshot.is_projected)
        self.assertEqual([node.id for node in snapshot.nodes], [1])

    def test_scenario_7_record_with_missing_or_unsupported_source_metadata(self):
        db = MagicMock()
        coord = SimpleNamespace(x=0, y=0, z=0, cluster_id=0, cluster_name="Sector 0")
        # Record with no uploaded data (missing metadata)
        record1 = SimpleNamespace(
            id=1, coordinate=coord, text_content="No source entry",
            knowledge_metadata={}, knowledge_type="fact",
            uploaded_data=None, created_at=datetime.now(timezone.utc),
        )
        db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = [record1]
        snapshot = get_universe_nodes(7, db)
        self.assertEqual(snapshot.nodes[0].source_type, "text")
        self.assertFalse(snapshot.nodes[0].has_source)

    def test_scenario_8_user_uploads_new_content_after_initial_projection(self):
        db = MagicMock()
        coord1 = KnowledgeCoordinate(knowledge_id=1, x=1.0, y=2.0, z=3.0)
        coord2 = KnowledgeCoordinate(knowledge_id=2, x=4.0, y=5.0, z=6.0)
        # 3 knowledge embeddings now exist (1 newly uploaded)
        embeddings = MagicMock()
        embeddings.all.return_value = [(1, [1.0, 0.0]), (2, [0.0, 1.0]), (3, [0.5, 0.5])]
        coords_mock = MagicMock()
        coords_mock.scalars.return_value.all.return_value = [coord1, coord2]
        db.execute.side_effect = [embeddings, coords_mock]

        result = project_user_knowledge(7, db)
        self.assertEqual(result["count"], 3)
        # Existing coordinates are updated and new coordinate record is added
        added = db.add.call_args.args[0]
        self.assertEqual(added.knowledge_id, 3)
        db.commit.assert_called_once()

    def test_scenario_9_user_isolation_cannot_access_other_users_data(self):
        db = MagicMock()
        # Authenticated user 7 attempts to fetch chunk belonging to user 99
        db.execute.return_value.scalar_one_or_none.return_value = None
        with self.assertRaises(HTTPException) as caught:
            get_chunk_detail(999, 7, db)
        self.assertEqual(caught.exception.status_code, 404)
        statement = db.execute.call_args.args[0]
        compiled = statement.whereclause.compile()
        self.assertEqual(compiled.params["user_id_1"], 7)

    def test_scenario_10_every_displayed_star_retains_correct_source_relationship(self):
        db = MagicMock()
        doc_source = SimpleNamespace(
            id=10, data_type=SimpleNamespace(value="docs"), tag="pdf",
            data_source="https://res.cloudinary.com/demo/raw/upload/v1/report.pdf",
            created_at=datetime.now(timezone.utc),
        )
        chunk = SimpleNamespace(
            id=42, text_content="Annual Report excerpt", knowledge_type="document",
            knowledge_metadata={"author": "Team"}, chunk_index=3, page_number=5,
            created_at=datetime.now(timezone.utc), uploaded_data=doc_source, user_id=7,
        )
        db.execute.return_value.scalar_one_or_none.return_value = chunk
        detail = get_chunk_detail(42, 7, db)
        self.assertEqual(detail.id, 42)
        self.assertIsNotNone(detail.source)
        self.assertEqual(detail.source.data_type, "docs")
        self.assertEqual(detail.source.tag, "pdf")
        self.assertEqual(detail.page_number, 5)
        self.assertEqual(detail.chunk_index, 3)


if __name__ == "__main__":
    unittest.main()

