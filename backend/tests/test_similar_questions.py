from datetime import datetime, timezone
import os
import unittest
from unittest.mock import Mock, patch

with patch.dict(os.environ, {
    "DATABASE_URL": "postgresql+psycopg2://test:test@localhost/test",
    "SECRET_KEY": "test-secret-key-for-isolated-tests-only", "OPENAI_API_KEY": "test",
    "TYPESAFE_API_KEY": "test", "CLOUDINARY_CLOUD_NAME": "test",
    "CLOUDINARY_API_KEY": "test", "CLOUDINARY_API_SECRET": "test", "MODEL": "test",
}):
    from sqlalchemy.dialects import postgresql
    from app.core_tasks.search import retrieval
    from app.db.model.chat import Message, Sender


class SimilarQuestionTests(unittest.TestCase):
    def test_no_matching_question_returns_empty_list(self):
        db = Mock()
        db.execute.return_value.first.return_value = None
        self.assertEqual(retrieval.semantic_to_find_similar_question(db, 7, 20, [0.0] * 1536), [])

    def test_lookup_is_user_scoped_relevant_prior_and_most_recent(self):
        db = Mock()
        db.execute.return_value.first.return_value = None
        retrieval.semantic_to_find_similar_question(db, 7, 20, [0.0] * 1536)
        statement = db.execute.call_args.args[0].compile(dialect=postgresql.dialect())
        sql = str(statement)
        self.assertIn("message.user_id =", sql)
        self.assertIn("message.id <", sql)
        self.assertIn("message.sent_by =", sql)
        self.assertIn("embeddings.kind =", sql)
        self.assertIn(" <= ", sql)
        self.assertIn("ORDER BY message.created_at DESC", sql)
        self.assertIn(7, statement.params.values())
        self.assertIn(20, statement.params.values())
        self.assertIn(Sender.USER, statement.params.values())
        self.assertIn(retrieval.SIMILAR_QUESTION_MAX_DISTANCE, statement.params.values())


class SimilarQuestionPayloadTests(unittest.IsolatedAsyncioTestCase):
    async def test_retrieval_passes_the_original_question_date_to_response_generation(self):
        asked_at = datetime(2026, 10, 17, 12, tzinfo=timezone.utc)
        previous = Message(id=12, chat_id=3, user_id=7, message_content="What languages do I know?",
                           sent_by=Sender.USER, created_at=asked_at)
        db = Mock()
        db.execute.return_value.first.return_value = (previous, 0.12)
        with patch.object(retrieval, "semantic_search", return_value=[]):
            result = await retrieval.retrieve_queries(db, 7, ["Which languages do I know?"],
                                                     ["semantic"], [{"vector": [0.0] * 1536}], 20, None)
        similar = result[0]["similar_question"]
        self.assertEqual(similar[0]["data"]["message_content"], previous.message_content)
        self.assertEqual(similar[0]["data"]["created_at"], asked_at.isoformat())
        self.assertEqual(similar[0]["source"], "message")
