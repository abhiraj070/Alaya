"use client";

import { useState, useEffect } from "react";
import FileNode from "./FileNode";
import AlayaCore from "./AlayaCore";
import ResultPanel from "./ResultPanel";

const mockFiles = [
  {
    id: "pdf-1",
    type: "PDF",
    name: "Financial_Report_Q3.pdf",
    size: "2.4 MB",
    meta: "18 pages",
    output: {
      content: "Revenue increased 14.2% YoY. Operating margin expanded by 180 bps across enterprise segments.",
      insights: "EBITDA: $42.5M (+12%), Gross Margin: 68.4%. Key risk: currency volatility in APAC.",
      ask: "What drove the margin expansion in Q3?",
      answer: "Primary drivers were supply chain optimization and higher enterprise retention rates.",
      badges: ["#financials", "#ebitda", "#q3-2026"],
    },
  },
  {
    id: "docx-1",
    type: "DOCX",
    name: "Product_Architecture.docx",
    size: "1.1 MB",
    meta: "12 sections",
    output: {
      content: "Modular microservices architecture using pgvector for 1536-dimensional embeddings and ARQ queue.",
      insights: "Latency: p95 < 120ms. Ingestion rate: 450 chunks/sec with recursive text splitting.",
      ask: "How are vector embeddings indexed?",
      answer: "Embeddings use HNSW indexing in PostgreSQL via the pgvector extension.",
      badges: ["#pgvector", "#arq-worker", "#architecture"],
    },
  },
  {
    id: "xlsx-1",
    type: "XLSX",
    name: "Customer_Cohort_Metrics.xlsx",
    size: "4.8 MB",
    meta: "14,200 rows",
    output: {
      content: "Ingested tabular records from 4 sheets. Auto-normalized column metadata and schema definitions.",
      insights: "Net Dollar Retention (NDR) is 126%. Churn rate reduced to 1.1% quarterly.",
      ask: "Which cohort shows highest retention?",
      answer: "The Q1 Enterprise cohort maintains the highest retention at 98.4% after 6 months.",
      badges: ["#tabular", "#ndr", "#retention"],
    },
  },
  {
    id: "img-1",
    type: "IMG",
    name: "System_Architecture_Whiteboard.png",
    size: "3.2 MB",
    meta: "Vision model",
    output: {
      content: "Visual OCR & Diagram parsing extracted 6 connected subsystems and API routing boundaries.",
      insights: "Detected: Redis Pub/Sub, FastAPI gateway, WebSocket channels, and Cloudinary storage.",
      ask: "What database connections are indicated?",
      answer: "PostgreSQL with connection pooling and Redis for asynchronous job queueing.",
      badges: ["#vision-ocr", "#diagram", "#infrastructure"],
    },
  },
];

export default function DocumentFlow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [stepPhase, setStepPhase] = useState("input"); // "input" -> "core" -> "output"

  const activeFile = mockFiles[activeIndex];

  // Auto-cycle through documents
  useEffect(() => {
    if (isPaused) return;

    // Timeline per document:
    // 0ms: Input active
    // 800ms: Core active
    // 1600ms: Output active
    // 3800ms: Next document
    const timerCore = setTimeout(() => setStepPhase("core"), 700);
    const timerOutput = setTimeout(() => setStepPhase("output"), 1500);

    const interval = setInterval(() => {
      setStepPhase("input");
      setActiveIndex((prev) => (prev + 1) % mockFiles.length);
    }, 4200);

    return () => {
      clearTimeout(timerCore);
      clearTimeout(timerOutput);
      clearInterval(interval);
    };
  }, [activeIndex, isPaused]);

  const handleSelectFile = (fileId) => {
    const idx = mockFiles.findIndex((f) => f.id === fileId);
    if (idx !== -1) {
      setActiveIndex(idx);
      setStepPhase("input");
      setTimeout(() => setStepPhase("core"), 400);
      setTimeout(() => setStepPhase("output"), 900);
    }
  };

  const outputPanels = [
    {
      type: "content",
      title: "Extracted Content",
      tag: "CHUNKED",
      content: activeFile.output.content,
      badges: activeFile.output.badges,
    },
    {
      type: "insights",
      title: "Key Insights",
      tag: "SYNTHESIS",
      content: activeFile.output.insights,
      badges: ["Auto-Tagged", "Vectorized"],
    },
    {
      type: "ask",
      title: "Ask Alaya",
      tag: "RETRIEVAL",
      content: (
        <div>
          <span className="font-semibold text-text-primary block mb-0.5">Q: {activeFile.output.ask}</span>
          <span className="text-accent-sky block">A: {activeFile.output.answer}</span>
        </div>
      ),
      badges: null,
    },
  ];

  return (
    <div
      className="relative w-full rounded-2xl border border-border-subtle bg-surface-primary/50 p-4 sm:p-6 backdrop-blur-sm"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Subtle Header Status Bar */}
      <div className="mb-4 flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-sky opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-sky" />
          </span>
          <span className="text-[11px] font-mono tracking-wider text-text-muted uppercase">
            DOCUMENT PROCESSING PIPELINE
          </span>
        </div>
        <div className="text-[10px] font-mono text-text-muted">
          MODE: <span className="text-accent-sky">AUTONOMOUS</span>
        </div>
      </div>

      {/* Grid: 3 Areas (Inputs -> Core -> Outputs) */}
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
        {/* Left Area: Document Inputs (col-span-4) */}
        <div className="flex flex-col gap-2.5 lg:col-span-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-text-muted uppercase">
              1. INPUT DOCUMENTS
            </span>
            <span className="text-[9px] text-text-muted">
              {mockFiles.length} SOURCES
            </span>
          </div>
          {mockFiles.map((f, idx) => (
            <FileNode
              key={f.id}
              file={f}
              isActive={idx === activeIndex}
              onClick={handleSelectFile}
            />
          ))}
        </div>

        {/* Center Area: Alaya Core (col-span-4) */}
        <div className="relative flex flex-col items-center justify-center py-4 lg:col-span-4 lg:py-0">
          <AlayaCore isProcessing={stepPhase === "core" || stepPhase === "output"} />
          <p className="mt-3 text-center text-[10px] font-mono tracking-wider text-text-muted uppercase">
            2. ALAYA RETRIEVAL CORE
          </p>
        </div>

        {/* Right Area: Result Outputs (col-span-4) */}
        <div className="flex flex-col gap-2.5 lg:col-span-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-text-muted uppercase">
              3. STRUCTURED KNOWLEDGE
            </span>
            <span className="text-[9px] text-accent-sky font-mono">
              REAL-TIME
            </span>
          </div>
          {outputPanels.map((panel, idx) => (
            <ResultPanel
              key={idx}
              panel={panel}
              isActive={stepPhase === "output"}
            />
          ))}
        </div>
      </div>

      {/* Interactive Footer Note */}
      <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-3 text-[10px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <svg className="h-3 w-3 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Click any file to focus processing sequence
        </span>
        <span className="font-mono">
          {isPaused ? "LOOP PAUSED" : "CONTINUOUS SYNC"}
        </span>
      </div>
    </div>
  );
}
