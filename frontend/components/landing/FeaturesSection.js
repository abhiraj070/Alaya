export default function FeaturesSection() {
  const features = [
    {
      title: "Documents & Memories",
      tag: "DUAL INGESTION",
      desc: "Add knowledge through direct document uploads (PDF, DOCX, XLSX, TXT, PPTX, Images) or write down thoughts, decisions, and habits in plain natural language. Both reside in one unified Knowledge Base.",
      icon: (
        <svg className="h-5 w-5 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
      bullets: ["Direct multi-format uploads", "Natural-language written memories", "Unified Knowledge Base"],
    },
    {
      title: "Knowledge Extraction",
      tag: "AUTOMATIC PARSING",
      desc: "Files are automatically split into structured chunks with contextual overlap. Metadata, tables, and document sections are parsed to preserve relationships.",
      icon: (
        <svg className="h-5 w-5 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
      bullets: ["Recursive text chunking", "Tabular and image OCR", "Dynamic entity extraction"],
    },
    {
      title: "Conversational Retrieval",
      tag: "HYBRID RETRIEVAL",
      desc: "Alaya dynamically chooses semantic vector candidates or deterministic metadata queries to find the precise facts before generating your answer.",
      icon: (
        <svg className="h-5 w-5 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      bullets: ["1536-dimensional embeddings", "pgvector HNSW index", "Hybrid semantic + SQL filter"],
    },
    {
      title: "Natural-Language Questions",
      tag: "CHAT EXPERIENCE",
      desc: "Interact with all your knowledge through a clean, intuitive chat interface. Ask questions in plain English and receive answers backed by transparent file citations.",
      icon: (
        <svg className="h-5 w-5 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      bullets: ["Grounded, factual answers", "Direct document references", "Conversational session history"],
    },
  ];

  return (
    <section id="features" className="relative scroll-mt-20 py-20 md:py-28 bg-bg-primary overflow-hidden border-t border-border-subtle">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-secondary px-3 py-1 text-xs font-semibold tracking-wider text-accent-sky uppercase">
            <span>CORE CAPABILITIES</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl lg:text-5xl leading-[1.15]">
            Engineered for precision. <br />
            <span className="text-accent-sky drop-shadow-[0_0_20px_rgba(56,189,248,0.25)]">
              Focused on conversation.
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
            Upload your documents, ask questions in plain language, and turn scattered
            information into answers you can use.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-primary/60 p-6 sm:p-8 backdrop-blur-sm transition-all duration-300 hover:border-accent-sky/50 hover:bg-surface-secondary hover:shadow-[0_0_24px_rgba(56,189,248,0.12)]"
            >
              <div>
                {/* Header Icon + Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-strong bg-surface-secondary group-hover:border-accent-sky/50 transition-colors">
                    {feat.icon}
                  </div>
                  <span className="rounded bg-surface-primary px-2 py-0.5 font-mono text-[10px] text-accent-sky border border-border-subtle">
                    {feat.tag}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-5 text-xl font-semibold text-text-primary group-hover:text-white transition-colors">
                  {feat.title}
                </h3>

                {/* Description */}
                <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">
                  {feat.desc}
                </p>
              </div>

              {/* Bullet highlights */}
              <div className="mt-6 border-t border-border-subtle pt-4">
                <ul className="space-y-1.5 text-xs text-text-muted">
                  {feat.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-accent-sky" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
