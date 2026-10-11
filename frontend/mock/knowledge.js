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

  // 2. Personal Everyday Memories (Natural Language)
  {
    id: "kb_mem_01",
    type: "memory",
    title: "Project Accomplishments",
    content: "Today, I finished implementing the authentication system for my project and fixed two bugs.",
    category: "Accomplishment",
    createdAt: "2026-03-04T18:45:00.000Z",
    tags: ["#accomplishment", "#auth", "#bugs"],
  },
  {
    id: "kb_mem_02",
    type: "memory",
    title: "Discussion with Rahul",
    content: "I had an interesting discussion with Rahul about using Redis for background jobs. We decided to use ARQ with FastAPI.",
    category: "Decision",
    createdAt: "2026-03-05T11:20:00.000Z",
    tags: ["#decision", "#redis", "#fastapi", "#rahul"],
  },
  {
    id: "kb_mem_03",
    type: "memory",
    title: "Internship Interview Experience",
    content: "The most important thing that happened today was my internship interview. They asked me about database indexing and distributed systems.",
    category: "Experience",
    createdAt: "2026-03-05T16:30:00.000Z",
    tags: ["#interview", "#experience", "#indexing"],
  },
  {
    id: "kb_mem_04",
    type: "memory",
    title: "Travel Project Idea",
    content: "I came across an interesting idea for a project while travelling today. I want to revisit it later.",
    category: "Idea",
    createdAt: "2026-03-06T09:15:00.000Z",
    tags: ["#idea", "#travel", "#creative"],
  },
];

export const mockDocuments = mockKnowledgeItems.filter((i) => i.type === "document");
export const mockMemories = mockKnowledgeItems.filter((i) => i.type === "memory");
