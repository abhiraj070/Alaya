"use client";

export default function ChatHeader({ onResetConversation, hasMessages }) {
  return (
    <div className="relative z-10 flex h-11 sm:h-12 shrink-0 items-center justify-between border-b border-border-subtle/70 bg-bg-primary/80 px-3 sm:px-4 backdrop-blur-sm select-none">
      {/* Context Indicator */}
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-accent-sky shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
        <span className="text-xs font-medium text-text-primary">
          Chat Workspace
        </span>
        <span className="hidden sm:inline-block text-[11px] text-text-muted">
          · Ingested Documents &amp; Memories
        </span>
      </div>

      {/* Actions: New Chat */}
      <div>
        {hasMessages ? (
          <button
            type="button"
            onClick={onResetConversation}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border-subtle bg-surface-secondary/60 text-xs text-text-secondary hover:text-accent-sky hover:border-accent-sky/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
            title="Start a new conversation"
            aria-label="Start a new conversation"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Chat</span>
          </button>
        ) : (
          <span className="text-[11px] font-mono text-text-muted">
            Ready
          </span>
        )}
      </div>
    </div>
  );
}
