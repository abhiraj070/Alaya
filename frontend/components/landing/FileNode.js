export default function FileNode({ file, isActive, onClick }) {
  // Color configuration by format
  const formatBadges = {
    pdf: "text-rose-400 border-rose-500/20 bg-rose-500/10",
    docx: "text-sky-400 border-sky-500/20 bg-sky-500/10",
    xlsx: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    pptx: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    txt: "text-purple-400 border-purple-500/20 bg-purple-500/10",
    img: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
  };

  const badgeClass = formatBadges[file.type.toLowerCase()] || "text-accent-sky border-accent-sky/20 bg-accent-sky/10";

  return (
    <button
      type="button"
      onClick={() => onClick(file.id)}
      className={`group relative flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky ${
        isActive
          ? "border-accent-sky bg-surface-secondary shadow-[0_0_16px_rgba(56,189,248,0.18)]"
          : "border-border-subtle bg-surface-primary/80 opacity-70 hover:border-border-strong hover:opacity-100"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Document Icon */}
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border text-[10px] font-bold uppercase transition-colors ${badgeClass}`}
        >
          {file.type}
        </span>

        {/* File Details */}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-text-primary group-hover:text-accent-sky transition-colors">
            {file.name}
          </p>
          <p className="text-[10px] text-text-muted">
            {file.size} • {file.meta}
          </p>
        </div>
      </div>

      {/* Active Indicator Pulse */}
      {isActive && (
        <span className="flex h-2 w-2 shrink-0 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-accent-sky opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-sky" />
        </span>
      )}
    </button>
  );
}
