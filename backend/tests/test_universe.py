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


if __name__ == "__main__":
    unittest.main()
