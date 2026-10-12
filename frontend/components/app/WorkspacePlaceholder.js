"use client";

export default function WorkspacePlaceholder({ activeTab = "chat" }) {
  if (activeTab === "knowledge") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 text-center select-none animate-fadeIn motion-reduce:animate-none">
        <div className="max-w-lg w-full rounded-2xl border border-border-strong bg-surface-primary/80 p-6 sm:p-8 md:p-10 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle top accent gradient */}
          <div
            className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-accent-sky/50 to-transparent"
            aria-hidden="true"
          />

          {/* Minimal Icon */}
          <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-border-strong bg-surface-secondary text-accent-sky shadow-inner mb-4 sm:mb-5">
            <svg
              className="h-6 w-6 sm:h-7 sm:w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M9 7h6" />
              <path d="M9 11h4" />
            </svg>
          </div>

          {/* Title & Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border-subtle bg-surface-secondary text-[11px] font-mono text-accent-sky mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-sky animate-pulse motion-reduce:animate-none" />
            <span>Knowledge Repository</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            Knowledge Base
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
            The unified space to manage and organize your external documents and personal natural-language memories.
          </p>

          {/* Feature highlights */}
          <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="rounded-xl border border-border-subtle bg-surface-secondary/50 p-3.5">
              <div className="flex items-center gap-2 text-text-primary text-xs font-semibold mb-1">
                <span className="text-accent-sky" aria-hidden="true">📄</span>
                <span>Uploaded Documents</span>
              </div>
              <p className="text-[11px] text-text-muted leading-normal">
                Files, PDFs, notes, and technical literature parsed and indexed.
              </p>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface-secondary/50 p-3.5">
              <div className="flex items-center gap-2 text-text-primary text-xs font-semibold mb-1">
                <span className="text-accent-sky" aria-hidden="true">🧠</span>
                <span>Personal Memories</span>
              </div>
              <p className="text-[11px] text-text-muted leading-normal">
                Everyday thoughts, decisions, and reflections captured in natural language.
              </p>
            </div>
          </div>

          <p className="mt-5 sm:mt-6 text-[11px] text-text-muted">
            Document management and memory capture interfaces will be integrated in Phase 6.
          </p>
        </div>
      </div>
    );
  }

  // Default: Chat Workspace
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 text-center select-none animate-fadeIn motion-reduce:animate-none">
      <div className="max-w-md w-full rounded-2xl border border-border-strong bg-surface-primary/80 p-6 sm:p-8 md:p-10 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Subtle top accent gradient */}
        <div
          className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-accent-sky/50 to-transparent"
          aria-hidden="true"
        />

        {/* Minimal Icon */}
        <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-border-strong bg-surface-secondary text-accent-sky shadow-inner mb-4 sm:mb-5">
          <svg
            className="h-6 w-6 sm:h-7 sm:w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>

        {/* Title & Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border-subtle bg-surface-secondary text-[11px] font-mono text-accent-sky mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-sky animate-pulse motion-reduce:animate-none" />
          <span>Conversational Workspace</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          Chat
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
          Ask questions, recall personal events, and synthesize answers across all stored knowledge through natural dialogue.
        </p>

        <p className="mt-5 sm:mt-6 text-[11px] text-text-muted">
          Real-time chat messaging, history, and streaming retrieval will be integrated in Phase 5.
        </p>
      </div>
    </div>
  );
}
