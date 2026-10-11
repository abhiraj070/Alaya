/**
 * Alaya Knowledge Base Mock Data
 * Supports two distinct knowledge types: Documents and Natural-Language Memories
 */

export const mockKnowledgeItems = [
  // 1. Uploaded Documents
  {
    id: "kb_doc_01",
    type: "document",
    title: "Research Paper.pdf",
    fileType: "pdf",
    fileSize: "2.4 MB",
    meta: "18 pages • 12 chunks",
    createdAt: "2026-03-01T10:30:00.000Z",
    tags: ["#research", "#latency", "#pgvector"],
  },
  {
    id: "kb_doc_02",
    type: "document",
    title: "Project Architecture.docx",
    fileType: "docx",
    fileSize: "1.1 MB",
    meta: "12 sections • 8 chunks",
    createdAt: "2026-03-02T14:15:00.000Z",
    tags: ["#architecture", "#redis", "#fastapi"],
  },
  {
    id: "kb_doc_03",
    type: "document",
    title: "Financial Report Q3.xlsx",
    fileType: "xlsx",
    fileSize: "3.8 MB",
    meta: "4 sheets • 16 chunks",
    createdAt: "2026-03-03T09:00:00.000Z",
    tags: ["#financials", "#telemetry", "#metrics"],
  },

  // 2. Natural-Language Written Memories
  {
    id: "kb_mem_01",
    type: "memory",
    title: "Project Accomplishments",
    content: "Today, I completed the authentication module and fixed two bugs in my project.",
    category: "Milestone",
    createdAt: "2026-03-04T18:45:00.000Z",
    tags: ["#progress", "#auth", "#bugs"],
  },
  {
    id: "kb_mem_02",
    type: "memory",
    title: "Architecture Decisions",
    content: "I discussed the new project architecture with my team. We decided to use Redis for background jobs.",
    category: "Decision",
    createdAt: "2026-03-05T11:20:00.000Z",
    tags: ["#team", "#redis", "#queue"],
  },
  {
    id: "kb_mem_03",
    type: "memory",
    title: "Work Habits & Preferences",
    content: "Remember that I prefer working on difficult tasks in the morning.",
    category: "Preference",
    createdAt: "2026-03-05T08:10:00.000Z",
    tags: ["#habits", "#focus", "#schedule"],
  },
];

export const mockDocuments = mockKnowledgeItems.filter((i) => i.type === "document");
export const mockMemories = mockKnowledgeItems.filter((i) => i.type === "memory");
