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

  // 2. Uploaded Images
  {
    id: "kb_img_01",
    type: "image",
    title: "System_Architecture_Whiteboard.png",
    fileType: "png",
    fileSize: "1.4 MB",
    dimensions: "1920 × 1080",
    previewUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'><rect width='400' height='260' fill='%230B0D0F'/><rect x='30' y='30' width='100' height='60' rx='8' fill='%2311161B' stroke='%2338BDF8' stroke-width='1.5'/><text x='80' y='65' fill='%23F5F7FA' font-family='sans-serif' font-size='11' text-anchor='middle'>FastAPI Core</text><rect x='270' y='30' width='100' height='60' rx='8' fill='%2311161B' stroke='%2338BDF8' stroke-width='1.5'/><text x='320' y='65' fill='%23F5F7FA' font-family='sans-serif' font-size='11' text-anchor='middle'>Redis Queue</text><rect x='150' y='160' width='100' height='60' rx='8' fill='%2311161B' stroke='%2322C55E' stroke-width='1.5'/><text x='200' y='195' fill='%23F5F7FA' font-family='sans-serif' font-size='11' text-anchor='middle'>PostgreSQL</text><line x1='130' y1='60' x2='270' y2='60' stroke='%2338BDF8' stroke-dasharray='4' stroke-width='1.5'/><line x1='80' y1='90' x2='150' y2='170' stroke='%23A1AAB5' stroke-width='1.5'/><line x1='320' y1='90' x2='250' y2='170' stroke='%23A1AAB5' stroke-width='1.5'/></svg>",
    createdAt: "2026-03-03T16:20:00.000Z",
    status: "Indexed",
    tags: ["#whiteboard", "#architecture", "#diagram"],
  },
  {
    id: "kb_img_02",
    type: "image",
    title: "Q3_Latency_Metrics_Chart.webp",
    fileType: "webp",
    fileSize: "720 KB",
    dimensions: "1280 × 720",
    previewUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'><rect width='400' height='260' fill='%230B0D0F'/><path d='M40 200 L100 160 L160 180 L220 110 L280 130 L340 70' fill='none' stroke='%2338BDF8' stroke-width='3'/><polyline points='40,200 100,160 160,180 220,110 280,130 340,70 340,220 40,220' fill='rgba(56,189,248,0.1)'/><circle cx='100' cy='160' r='4' fill='%2338BDF8'/><circle cx='220' cy='110' r='4' fill='%2338BDF8'/><circle cx='340' cy='70' r='4' fill='%2338BDF8'/><text x='50' y='40' fill='%23A1AAB5' font-family='sans-serif' font-size='11'>Latency: Flat vs HNSW Vector Index</text></svg>",
    createdAt: "2026-03-04T12:00:00.000Z",
    status: "Indexed",
    tags: ["#metrics", "#latency", "#pgvector"],
  },

  // 3. Personal Everyday Memories (Natural Language)
  {
    id: "kb_mem_01",
    type: "memory",
    title: "Project Accomplishments",
    content: "Today, I finished implementing the authentication system for my project and fixed two bugs.",
    category: "Accomplishment",
    createdAt: "2026-03-04T18:45:00.000Z",
    status: "Grounded",
    tags: ["#accomplishment", "#auth", "#bugs"],
  },
  {
    id: "kb_mem_02",
    type: "memory",
    title: "Discussion with Rahul",
    content: "I had an interesting discussion with Rahul about using Redis for background jobs. We decided to use ARQ with FastAPI.",
    category: "Decision",
    createdAt: "2026-03-05T11:20:00.000Z",
    status: "Grounded",
    tags: ["#decision", "#redis", "#fastapi", "#rahul"],
  },
  {
    id: "kb_mem_03",
    type: "memory",
    title: "Internship Interview Experience",
    content: "The most important thing that happened today was my internship interview. They asked me about database indexing and distributed systems.",
    category: "Experience",
    createdAt: "2026-03-05T16:30:00.000Z",
    status: "Grounded",
    tags: ["#interview", "#experience", "#indexing"],
  },
  {
    id: "kb_mem_04",
    type: "memory",
    title: "Travel Project Idea",
    content: "I came across an interesting idea for a project while travelling today. I want to revisit it later.",
    category: "Idea",
    createdAt: "2026-03-06T09:15:00.000Z",
    status: "Grounded",
    tags: ["#idea", "#travel", "#creative"],
  },
];

export const mockDocuments = mockKnowledgeItems.filter((i) => i.type === "document");
export const mockImages = mockKnowledgeItems.filter((i) => i.type === "image");
export const mockMemories = mockKnowledgeItems.filter((i) => i.type === "memory");
