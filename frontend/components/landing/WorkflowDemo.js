"use client";

export default function WorkflowDemo({ activeStage, onSelectStage }) {
  const stages = [
    { id: 1, label: "01. Upload" },
    { id: 2, label: "02. Extract" },
    { id: 3, label: "03. Understand" },
    { id: 4, label: "04. Ask" },
  ];

  return (
    <div className="relative mt-8 w-full rounded-2xl border border-border-strong bg-surface-primary/70 p-5 sm:p-7 backdrop-blur-md shadow-2xl">
      {/* Top Demo Bar: Stage Switcher Tabs & Live Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
        {/* Stage Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {stages.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => onSelectStage(st.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky ${
                activeStage === st.id
                  ? "border border-accent-sky/50 bg-surface-secondary text-accent-sky shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                  : "border border-transparent text-text-muted hover:border-border-subtle hover:text-text-primary"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-sky opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-sky" />
          </span>
          <span className="text-text-secondary">INTERACTIVE STAGE PREVIEW</span>
        </div>
      </div>

      {/* Main Interactive Stage Demonstration Body */}
      <div className="mt-6">
        {activeStage === 1 && <UploadDemo />}
        {activeStage === 2 && <ExtractDemo />}
        {activeStage === 3 && <UnderstandDemo />}
        {activeStage === 4 && <AskDemo />}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Stage 1: Upload Demonstration View
// -----------------------------------------------------------------------------
function UploadDemo() {
  const fileCards = [
    { name: "Company_Q3_Financials.pdf", type: "PDF", size: "3.4 MB", status: "Uploaded" },
    { name: "Retrieval_Pipeline_Design.docx", type: "DOCX", size: "1.2 MB", status: "Uploaded" },
    { name: "Customer_Usage_Telemetry.xlsx", type: "XLSX", size: "4.8 MB", status: "Ingesting" },
    { name: "Architecture_Overview.png", type: "IMG", size: "2.1 MB", status: "Queued" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
      {/* Left: Drag & Drop Dropzone Simulation */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-accent-sky/40 bg-surface-secondary/40 p-6 text-center transition-colors">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-strong bg-surface-secondary text-accent-sky shadow-inner">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-semibold text-text-primary">
          Drop files to ingest into Alaya
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Supports PDF, DOCX, TXT, Markdown, CSV, XLSX, PPTX & Images
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {["PDF", "DOCX", "XLSX", "TXT", "PPTX", "PNG"].map((ext) => (
            <span
              key={ext}
              className="rounded border border-border-subtle bg-surface-primary px-2 py-0.5 text-[10px] font-mono text-text-secondary"
            >
              .{ext.toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Upload Queue & Ingestion Status */}
      <div className="lg:col-span-6 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-text-muted pb-1">
          <span>ACTIVE INGESTION QUEUE</span>
          <span className="text-accent-sky">4 FILES DETECTED</span>
        </div>
        {fileCards.map((f, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-secondary/80 px-3.5 py-2.5 transition-all hover:border-border-strong"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-accent-sky/30 bg-accent-sky/10 text-[10px] font-bold text-accent-sky">
                {f.type}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-text-primary">{f.name}</p>
                <p className="text-[10px] text-text-muted">{f.size}</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                f.status === "Uploaded"
                  ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                  : f.status === "Ingesting"
                  ? "text-accent-sky border-accent-sky/20 bg-accent-sky/10 animate-pulse"
                  : "text-text-muted border-border-subtle bg-surface-primary"
              }`}
            >
              {f.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Stage 2: Extract Demonstration View
// -----------------------------------------------------------------------------
function ExtractDemo() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
      {/* Raw Document Representation */}
      <div className="lg:col-span-5 rounded-xl border border-border-subtle bg-surface-secondary/50 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <span className="text-xs font-semibold text-text-primary">Source Document</span>
            <span className="text-[10px] font-mono text-text-muted">RAW BYTES</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-4 w-3/4 rounded bg-surface-tertiary animate-pulse" />
            <div className="h-3 w-full rounded bg-surface-tertiary opacity-70" />
            <div className="h-3 w-5/6 rounded bg-surface-tertiary opacity-70" />
            <div className="h-3 w-4/5 rounded bg-surface-tertiary opacity-50" />
            <div className="mt-4 h-16 w-full rounded border border-border-subtle bg-surface-primary/70 p-2 flex items-center justify-center">
              <span className="text-[11px] font-mono text-text-muted">
                [Tabular / Vision Extractor Active]
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-accent-sky border-t border-border-subtle pt-2">
          <span>PARSER: NATIVE & OCR</span>
          <span>STATUS: COMPLETE</span>
        </div>
      </div>

      {/* Middle Animated Transformation Arrow */}
      <div className="lg:col-span-2 flex flex-col items-center justify-center py-2 lg:py-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-sky/40 bg-surface-secondary text-accent-sky shadow-[0_0_15px_rgba(56,189,248,0.2)]">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
        <span className="mt-2 text-[10px] font-mono text-text-muted uppercase">Normalize</span>
      </div>

      {/* Extracted Structured Output */}
      <div className="lg:col-span-5 rounded-xl border border-border-strong bg-surface-secondary/80 p-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <span className="text-xs font-semibold text-accent-sky">Structured Text & Metadata</span>
          <span className="text-[10px] font-mono text-emerald-400">NORMALIZED</span>
        </div>
        <div className="mt-3 space-y-2.5 text-[11px] font-mono text-text-secondary leading-relaxed">
          <div className="rounded bg-surface-primary p-2 border border-border-subtle">
            <span className="text-text-muted block text-[10px]">SECTION: Executive Summary</span>
            <span className="text-text-primary">"Operating margins grew 180 bps across enterprise tiers in Q3 2026."</span>
          </div>
          <div className="rounded bg-surface-primary p-2 border border-border-subtle">
            <span className="text-text-muted block text-[10px]">EXTRACTED METADATA</span>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="text-accent-sky">entity: EBITDA</span>
              <span className="text-text-muted">•</span>
              <span className="text-accent-sky">value: $42.5M</span>
              <span className="text-text-muted">•</span>
              <span className="text-accent-sky">growth: +12% YoY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Stage 3: Understand Demonstration View
// -----------------------------------------------------------------------------
function UnderstandDemo() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
      {/* Chunking Pipeline */}
      <div className="lg:col-span-5 rounded-xl border border-border-subtle bg-surface-secondary/60 p-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <span className="text-xs font-semibold text-text-primary">Recursive Text Splitting</span>
          <span className="text-[10px] font-mono text-accent-sky">128-TOKEN OVERLAP</span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="rounded border border-accent-sky/30 bg-surface-primary p-2 text-[11px]">
            <div className="flex justify-between text-[10px] font-mono text-accent-sky mb-1">
              <span>CHUNK #01</span>
              <span>1536-D EMBEDDED</span>
            </div>
            <p className="text-text-secondary text-[11px] leading-snug">
              Alaya normalizes multi-topic document paragraphs into distinct standalone facts.
            </p>
          </div>
          <div className="rounded border border-border-subtle bg-surface-primary p-2 text-[11px]">
            <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1">
              <span>CHUNK #02</span>
              <span>1536-D EMBEDDED</span>
            </div>
            <p className="text-text-secondary text-[11px] leading-snug">
              Metadata filters and semantic vectors stored alongside pgvector indices.
            </p>
          </div>
        </div>
      </div>

      {/* Conceptual Knowledge Graph & Semantic Representation */}
      <div className="lg:col-span-7 rounded-xl border border-border-strong bg-surface-secondary/80 p-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <span className="text-xs font-semibold text-text-primary">Semantic Knowledge Graph</span>
          <span className="text-[10px] font-mono text-text-muted">VECTOR SPACE CLUSTER</span>
        </div>

        {/* Visual Graph Representation via SVG */}
        <div className="relative mt-3 h-44 w-full rounded-lg bg-surface-primary border border-border-subtle p-2 flex items-center justify-center overflow-hidden">
          <svg className="h-full w-full" viewBox="0 0 360 160" fill="none">
            {/* Connecting Edges */}
            <line x1="80" y1="80" x2="180" y2="50" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="80" y1="80" x2="180" y2="120" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" />
            <line x1="180" y1="50" x2="280" y2="80" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="1.5" />
            <line x1="180" y1="120" x2="280" y2="80" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Node 1: Document Entity */}
            <circle cx="80" cy="80" r="16" fill="#0D1014" stroke="#7DD3FC" strokeWidth="2" />
            <text x="80" y="83" fill="#F5F7FA" fontSize="8" fontFamily="monospace" textAnchor="middle">FACT</text>

            {/* Node 2: Vector Cluster A */}
            <circle cx="180" cy="50" r="20" fill="#0D1014" stroke="#38BDF8" strokeWidth="2" />
            <text x="180" y="53" fill="#38BDF8" fontSize="8" fontFamily="monospace" textAnchor="middle">VECTOR</text>

            {/* Node 3: Metadata Attribute */}
            <circle cx="180" cy="120" r="18" fill="#0D1014" stroke="#38BDF8" strokeWidth="1.5" />
            <text x="180" y="123" fill="#A1AAB5" fontSize="8" fontFamily="monospace" textAnchor="middle">META</text>

            {/* Node 4: Synthesis Index */}
            <circle cx="280" cy="80" r="22" fill="#0D1014" stroke="#38BDF8" strokeWidth="2" className="animate-pulse" />
            <text x="280" y="83" fill="#7DD3FC" fontSize="8" fontFamily="monospace" textAnchor="middle">ALAYA</text>
          </svg>

          {/* Overlay Tag */}
          <div className="absolute bottom-2 right-2 rounded bg-surface-secondary/90 px-2 py-0.5 text-[9px] font-mono text-accent-sky border border-border-subtle">
            HNSW INDEX READY
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Stage 4: Ask Demonstration View
// -----------------------------------------------------------------------------
function AskDemo() {
  return (
    <div className="rounded-xl border border-border-strong bg-surface-secondary/70 p-5">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-sky/15 text-accent-sky border border-accent-sky/30">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span className="text-xs font-semibold text-text-primary">Conversational Retrieval Chat</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400">HYBRID RETRIEVAL ACTIVE</span>
      </div>

      <div className="mt-4 space-y-3">
        {/* User Prompt */}
        <div className="flex justify-end">
          <div className="max-w-md rounded-xl rounded-tr-sm bg-surface-tertiary px-3.5 py-2.5 text-xs text-text-primary border border-border-strong">
            "What factors drove operating margin expansion in Q3?"
          </div>
        </div>

        {/* Alaya Synthesized Answer */}
        <div className="flex justify-start">
          <div className="max-w-xl rounded-xl rounded-tl-sm bg-surface-primary px-4 py-3 text-xs text-text-secondary border border-accent-sky/30 shadow-[0_0_16px_rgba(56,189,248,0.1)]">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-accent-sky mb-1">
              <span>ALAYA INTELLIGENCE</span>
              <span>•</span>
              <span>CONFIDENCE 98.6%</span>
            </div>
            <p className="leading-relaxed text-text-primary">
              Operating margin expanded by <strong className="text-accent-sky">180 basis points</strong> in Q3 2026.
              The primary factors were supply chain efficiencies and an increase in enterprise retention (NDR reaching 126%).
            </p>
            {/* Citations Preview */}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-2 text-[10px]">
              <span className="text-text-muted">Sources:</span>
              <span className="rounded bg-surface-secondary px-2 py-0.5 font-mono text-accent-sky border border-border-subtle">
                Company_Q3_Financials.pdf §4.1
              </span>
              <span className="rounded bg-surface-secondary px-2 py-0.5 font-mono text-accent-sky border border-border-subtle">
                Customer_Usage_Telemetry.xlsx
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
