export default function ResultPanel({ panel, isActive }) {
  const icons = {
    content: (
      <svg className="h-3.5 w-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    insights: (
      <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    ask: (
      <svg className="h-3.5 w-3.5 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  };

  return (
    <div
      className={`group relative rounded-lg border p-3 transition-all duration-300 ${
        isActive
          ? "border-accent-sky/60 bg-surface-secondary shadow-[0_0_16px_rgba(56,189,248,0.12)]"
          : "border-border-subtle bg-surface-primary/70 opacity-70"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-primary border border-border-strong">
            {icons[panel.type]}
          </span>
          <span className="text-xs font-semibold text-text-primary">
            {panel.title}
          </span>
        </div>
        <span className="text-[10px] font-mono text-text-muted">
          {panel.tag}
        </span>
      </div>

      {/* Snippet Content */}
      <div className="mt-2 text-[11px] leading-relaxed text-text-secondary">
        {panel.content}
      </div>

      {/* Tags / Structured Badges */}
      {panel.badges && panel.badges.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {panel.badges.map((b, i) => (
            <span
              key={i}
              className="rounded bg-surface-primary px-1.5 py-0.5 text-[9px] font-mono text-accent-sky border border-border-subtle"
            >
              {b}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
