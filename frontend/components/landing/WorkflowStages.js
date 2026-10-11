"use client";

export default function WorkflowStages({ activeStage, onSelectStage, isVisible }) {
  const stages = [
    {
      id: 1,
      num: "01",
      title: "Upload",
      desc: "Add your documents in any supported format.",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
      microVisual: (
        <div className="mt-3 flex items-center gap-1">
          {["PDF", "DOCX", "XLSX"].map((ext, i) => (
            <span
              key={i}
              className="rounded border border-border-subtle bg-surface-primary px-1.5 py-0.5 text-[9px] font-mono text-text-muted"
            >
              {ext}
            </span>
          ))}
          <span className="text-[9px] text-accent-sky font-mono">+more</span>
        </div>
      ),
    },
    {
      id: 2,
      num: "02",
      title: "Extract",
      desc: "Alaya extracts clean, structured content.",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      microVisual: (
        <div className="mt-3 flex flex-col gap-1 w-full max-w-[130px]">
          <div className="h-1.5 w-full rounded bg-accent-sky/40" />
          <div className="h-1.5 w-4/5 rounded bg-surface-tertiary" />
          <div className="h-1.5 w-2/3 rounded bg-surface-tertiary" />
        </div>
      ),
    },
    {
      id: 3,
      num: "03",
      title: "Understand",
      desc: "Content is chunked, embedded, and stored in your knowledge base.",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      ),
      microVisual: (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-sky" />
          <span className="h-0.5 w-4 bg-accent-sky/40" />
          <span className="h-2 w-2 rounded-full bg-accent-sky/70" />
          <span className="h-0.5 w-4 bg-accent-sky/40" />
          <span className="h-2 w-2 rounded-full bg-accent-sky" />
        </div>
      ),
    },
    {
      id: 4,
      num: "04",
      title: "Ask",
      desc: "Chat with your knowledge and get accurate answers.",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      microVisual: (
        <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-text-muted">
          <span className="text-text-primary">Q:</span> Fact?
          <span className="text-accent-sky font-semibold ml-1">A:</span> Answer
        </div>
      ),
    },
  ];

  return (
    <div className="relative w-full">
      {/* Desktop Horizontal Connectors (hidden on mobile) */}
      <div className="hidden lg:block absolute top-12 left-12 right-12 h-0.5 pointer-events-none" aria-hidden="true">
        <svg className="w-full h-4 overflow-visible" fill="none">
          <line
            x1="0"
            y1="2"
            x2="100%"
            y2="2"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
          {/* Active Flow Line indicator */}
          <line
            x1="0"
            y1="2"
            x2={`${((activeStage - 1) / 3) * 100}%`}
            y2="2"
            stroke="#38BDF8"
            strokeWidth="2"
            className="transition-all duration-500 ease-out"
          />
        </svg>
      </div>

      {/* Grid of 4 Stages */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage, idx) => {
          const isActive = activeStage === stage.id;
          const isPassed = activeStage >= stage.id;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectStage(stage.id)}
              className={`group relative flex flex-col justify-between rounded-xl border p-5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky ${
                isActive
                  ? "border-accent-sky/70 bg-surface-secondary shadow-[0_0_24px_rgba(56,189,248,0.15)] -translate-y-1"
                  : "border-border-subtle bg-surface-primary/60 hover:border-border-strong hover:bg-surface-primary hover:-translate-y-0.5"
              } ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{
                transitionDelay: `${idx * 120}ms`,
              }}
            >
              <div>
                {/* Top Row: Number and Icon */}
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold transition-colors ${
                      isPassed ? "text-accent-sky" : "text-text-muted"
                    }`}
                  >
                    {stage.num}
                  </span>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                      isActive
                        ? "border-accent-sky bg-accent-sky/15 text-accent-sky shadow-[0_0_12px_rgba(56,189,248,0.3)]"
                        : "border-border-subtle bg-surface-secondary text-text-secondary group-hover:border-border-strong group-hover:text-text-primary"
                    }`}
                  >
                    {stage.icon}
                  </div>
                </div>

                {/* Stage Heading */}
                <h3 className="mt-4 text-base font-semibold text-text-primary group-hover:text-white">
                  {stage.title}
                </h3>

                {/* Stage Description */}
                <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
                  {stage.desc}
                </p>
              </div>

              {/* Bottom Micro-Visual & Action Cue */}
              <div className="mt-4 pt-3 border-t border-border-subtle/60 flex items-center justify-between">
                {stage.microVisual}
                <span
                  className={`text-[10px] font-mono transition-colors ${
                    isActive ? "text-accent-sky font-semibold" : "text-text-muted group-hover:text-text-secondary"
                  }`}
                >
                  {isActive ? "VIEWING" : "SELECT"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
