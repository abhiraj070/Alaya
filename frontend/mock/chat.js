/**
 * Mock chat sessions and messages for frontend-only demonstration in subsequent phases.
 */
export const mockChatSessions = [
  {
    id: "session_mock_01",
    title: "Knowledge Retrieval Discussion",
    createdAt: "2026-03-01T14:00:00.000Z",
  },
];

export const mockMessages = [
  {
    id: "msg_mock_01",
    sessionId: "session_mock_01",
    sender: "assistant",
    content: "Welcome to Alaya. How can I assist with your personal knowledge base today?",
    timestamp: "2026-03-01T14:00:05.000Z",
  },
];
