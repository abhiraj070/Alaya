"use client";

export default function WorkflowStages({ activeStage, onSelectStage, isVisible }) {
  const stages = [
    {
      id: 1,
      num: "01",
      title: "Bring Your Knowledge",
      desc: "Upload documents or write naturally about events, ideas, and information you want to remember.",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
      cue: "Files & Memories",
    },
    {
      id: 2,
      num: "02",
      title: "Build Your Knowledge Base",
      desc: "Alaya organizes and indexes your documents and written thoughts into a unified, searchable space.",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
      cue: "Unified Indexing",
    },
    {
      id: 3,
      num: "03",
      title: "Ask Naturally",
      desc: "Ask questions about information you've added in plain conversational English whenever you need answers.",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      cue: "Plain English Queries",
    },
    {
      id: 4,
      num: "04",
      title: "Rediscover Information",
      desc: "See accurate, synthesized answers grounded directly in your stored knowledge with source references.",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      cue: "Grounded Answers",
    },
  ];

  return (
    <div className="relative w-full">
      {/* Desktop Horizontal Connecting Line */}
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
          {/* Active Flow Fill */}
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
                transitionDelay: `${idx * 100}ms`,
              }}
            >
              <div>
                {/* Number & Icon */}
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

                {/* Title */}
                <h3 className="mt-4 text-base font-semibold text-text-primary group-hover:text-white">
                  {stage.title}
                </h3>

                {/* Description */}
                <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
                  {stage.desc}
                </p>
              </div>

              {/* Bottom Tag */}
              <div className="mt-4 pt-3 border-t border-border-subtle/60 flex items-center justify-between text-[10px] font-mono">
                <span className="text-text-muted">{stage.cue}</span>
                <span className={isActive ? "text-accent-sky font-semibold" : "text-text-muted"}>
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
