/**
 * Alaya Mock Chat Fixture & Local Response Matching Engine
 * Strictly local demonstration responses derived from mock documents and personal memories.
 */

export const examplePrompts = [
  "What did I accomplish today?",
  "What are the main findings in my research paper?",
  "What did we decide about Redis?",
];

export const mockConversation = [
  {
    id: "msg_init_1",
    sender: "user",
    text: "What are the main findings in my research paper?",
    timestamp: "10:24 AM",
  },
  {
    id: "msg_init_2",
    sender: "alaya",
    text: `Based on the sample document "Research Paper.pdf" (Climate Dynamics & Coastal Infrastructure):

1. Rising sea levels significantly increase coastal flooding risk across shoreline communities.
2. The frequency and magnitude of storm surges create compound challenges for urban defenses.
3. Regional drainage and water management infrastructure face severe pressure without structural modernization.`,
    source: 'Document · "Research Paper.pdf"',
    timestamp: "10:24 AM",
  },
];

export const mockChats = [
  {
    id: "chat-1",
    title: "Research Paper Findings",
    createdAt: 1713000000000,
    messages: [
      {
        id: "msg_1_1",
        sender: "user",
        text: "What are the main findings in my research paper?",
        timestamp: "10:24 AM",
      },
      {
        id: "msg_1_2",
        sender: "alaya",
        text: `Based on the sample document "Research Paper.pdf" (Climate Dynamics & Coastal Infrastructure):

1. Rising sea levels significantly increase coastal flooding risk across shoreline communities.
2. The frequency and magnitude of storm surges create compound challenges for urban defenses.
3. Regional drainage and water management infrastructure face severe pressure without structural modernization.`,
        source: 'Document · "Research Paper.pdf"',
        timestamp: "10:24 AM",
      },
    ],
  },
  {
    id: "chat-2",
    title: "Redis & Background Workers",
    createdAt: 1712990000000,
    messages: [
      {
        id: "msg_2_1",
        sender: "user",
        text: "What did we decide about Redis?",
        timestamp: "08:15 AM",
      },
      {
        id: "msg_2_2",
        sender: "alaya",
        text: `According to your recorded discussion notes with Rahul:\n\nYou discussed background job execution strategies and decided to use ARQ with FastAPI rather than heavier alternatives to keep task queues lightweight and asynchronous.`,
        source: 'Personal Memory · "Discussion with Rahul"',
        timestamp: "08:15 AM",
      },
    ],
  },
  {
    id: "chat-3",
    title: "Today's Accomplishments",
    createdAt: 1712980000000,
    messages: [
      {
        id: "msg_3_1",
        sender: "user",
        text: "What did I accomplish today?",
        timestamp: "06:40 PM",
      },
      {
        id: "msg_3_2",
        sender: "alaya",
        text: `Based on your personal memory log recorded today:\n\nYou noted that you finished implementing the authentication system for your project and fixed two bugs.`,
        source: 'Personal Memory · "Project Accomplishments"',
        timestamp: "06:40 PM",
      },
    ],
  },
  {
    id: "chat-4",
    title: "Q3 Financial Analysis",
    createdAt: 1712970000000,
    messages: [
      {
        id: "msg_4_1",
        sender: "user",
        text: "Summarize Q3 financial revenue and margins",
        timestamp: "02:10 PM",
      },
      {
        id: "msg_4_2",
        sender: "alaya",
        text: `Based on "Financial Report Q3.xlsx":\n\nThe report records 24% quarter-over-quarter growth, strong operating margins, and continued investment in core knowledge infrastructure.`,
        source: 'Document · "Financial Report Q3.xlsx"',
        timestamp: "02:10 PM",
      },
    ],
  },
  {
    id: "chat-5",
    title: "System Architecture Spec",
    createdAt: 1712960000000,
    messages: [
      {
        id: "msg_5_1",
        sender: "user",
        text: "What is the system architecture stack?",
        timestamp: "11:05 AM",
      },
      {
        id: "msg_5_2",
        sender: "alaya",
        text: `According to "Project Architecture.docx":\n\nThe Alaya technical architecture combines a FastAPI service layer, PostgreSQL with pgvector for embeddings, and a Next.js App Router frontend for the workspace.`,
        source: 'Document · "Project Architecture.docx"',
        timestamp: "11:05 AM",
      },
    ],
  },
  {
    id: "chat-6",
    title: "Internship Interview Notes",
    createdAt: 1712950000000,
    messages: [
      {
        id: "msg_6_1",
        sender: "user",
        text: "What did I take notes on from my internship interview?",
        timestamp: "04:30 PM",
      },
      {
        id: "msg_6_2",
        sender: "alaya",
        text: `From your personal notes regarding your internship interview:\n\nThe discussion centered around database indexing techniques (such as B-Tree and vector indexes) and distributed systems architectural patterns.`,
        source: 'Personal Memory · "Internship Interview Experience"',
        timestamp: "04:30 PM",
      },
    ],
  },
  {
    id: "chat-7",
    title: "Travel Project Ideas",
    createdAt: 1712940000000,
    messages: [
      {
        id: "msg_7_1",
        sender: "user",
        text: "What travel project idea did I write down?",
        timestamp: "09:20 AM",
      },
      {
        id: "msg_7_2",
        sender: "alaya",
        text: `From your personal reflection notes:\n\nYou recorded an interesting creative project idea while travelling that you flagged to revisit and explore further.`,
        source: 'Personal Memory · "Travel Project Idea"',
        timestamp: "09:20 AM",
      },
    ],
  },
  {
    id: "chat-8",
    title: "Database Indexing Strategy",
    createdAt: 1712930000000,
    messages: [],
  },
];

/**
 * Predictable local response selector matching keywords against mock knowledge base.
 * Returns { text: string, source: string }
 */
export function findMockResponse(userQuery) {
  const query = (userQuery || "").toLowerCase().trim();

  // 1. Accomplishments & Today's tasks (Natural-Language Memory)
  if (
    query.includes("accomplish") ||
    query.includes("today") ||
    query.includes("finished") ||
    query.includes("bugs") ||
    query.includes("progress") ||
    query.includes("work done")
  ) {
    return {
      text: `Based on your personal memory log recorded today:

You noted that you finished implementing the authentication system for your project and fixed two bugs.`,
      source: 'Personal Memory · "Project Accomplishments"',
    };
  }

  // 2. Redis & Background jobs (Natural-Language Memory)
  if (
    query.includes("redis") ||
    query.includes("rahul") ||
    query.includes("background") ||
    query.includes("arq") ||
    query.includes("job") ||
    query.includes("fastapi")
  ) {
    return {
      text: `According to your recorded discussion notes with Rahul:

You discussed background job execution strategies and decided to use ARQ with FastAPI rather than heavier alternatives to keep task queues lightweight and asynchronous.`,
      source: 'Personal Memory · "Discussion with Rahul"',
    };
  }

  // 3. Research Paper & Climate Findings (Document-derived)
  if (
    query.includes("research") ||
    query.includes("paper") ||
    query.includes("climate") ||
    query.includes("finding") ||
    query.includes("sea") ||
    query.includes("flood")
  ) {
    return {
      text: `Based on the sample research document "Research Paper.pdf" (Climate Dynamics & Coastal Infrastructure):

1. Accelerating sea level rise elevates coastal inundation risk across low-lying zones.
2. Compounding storm surges present acute challenges for municipal planning.
3. Aging drainage and protective barriers require prioritized capital modernization.`,
      source: 'Document · "Research Paper.pdf"',
    };
  }

  // 4. Internship Interview Experience (Natural-Language Memory)
  if (
    query.includes("interview") ||
    query.includes("internship") ||
    query.includes("indexing") ||
    query.includes("distributed")
  ) {
    return {
      text: `From your personal notes regarding your internship interview:

The discussion centered around database indexing techniques (such as B-Tree and vector indexes) and distributed systems architectural patterns.`,
      source: 'Personal Memory · "Internship Interview Experience"',
    };
  }

  // 5. Travel Project Idea (Natural-Language Memory)
  if (
    query.includes("travel") ||
    query.includes("travelling") ||
    query.includes("traveling") ||
    query.includes("idea")
  ) {
    return {
      text: `From your personal reflection notes:

You recorded an interesting creative project idea while travelling that you flagged to revisit and explore further.`,
      source: 'Personal Memory · "Travel Project Idea"',
    };
  }

  // 6. Financial Report (Document-derived)
  if (
    query.includes("financial") ||
    query.includes("finance") ||
    query.includes("revenue") ||
    query.includes("q3") ||
    query.includes("margin")
  ) {
    return {
      text: `Based on "Financial Report Q3.xlsx":

The report records 24% quarter-over-quarter growth, strong operating margins, and continued investment in core knowledge infrastructure.`,
      source: 'Document · "Financial Report Q3.xlsx"',
    };
  }

  // 7. System Architecture (Document-derived)
  if (
    query.includes("architecture") ||
    query.includes("system") ||
    query.includes("stack")
  ) {
    return {
      text: `According to "Project Architecture.docx":

The Alaya technical architecture combines a FastAPI service layer, PostgreSQL with pgvector for embeddings, and a Next.js App Router frontend for the workspace.`,
      source: 'Document · "Project Architecture.docx"',
    };
  }

  // 8. General Summary / Remember
  if (
    query.includes("remember") ||
    query.includes("important") ||
    query.includes("summary") ||
    query.includes("summarize")
  ) {
    return {
      text: `Here is a summary of key knowledge currently in your local demonstration database:

1. Project Accomplishments: Finished authentication module and resolved two bugs.
2. Architecture Decision: Using Redis with ARQ and FastAPI for background tasks.
3. Research Paper: Coastal infrastructure challenges under accelerating sea-level rise.
4. Internship Interview: Focused on database indexing and distributed systems.`,
      source: "Knowledge Synthesis · Documents & Memories",
    };
  }

  // 9. Generic Fallback
  return {
    text: `I searched across your sample demonstration knowledge base, but I couldn't find a direct record matching this specific query.

In this local prototype, you can ask about:
• Today's accomplishments (authentication module & bug fixes)
• Decisions made about Redis & background jobs
• Findings in the coastal research paper
• Internship interview topics and travel ideas`,
    source: "Local Demonstration Search",
  };
}
