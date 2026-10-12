"use client";

export default function SidebarItem({
  id,
  label,
  icon: Icon,
  isActive = false,
  isCollapsed = false,
  onClick,
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`nav-item-${id}`}
      aria-selected={isActive}
      aria-label={label}
      title={isCollapsed ? label : undefined}
      onClick={onClick}
      className={`relative group flex items-center gap-3 w-full rounded-xl transition-all duration-200 motion-reduce:transition-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky ${
        isCollapsed
          ? "justify-center px-0 py-3 h-11"
          : "px-3.5 py-2.5 h-11 text-left"
      } ${
        isActive
          ? "bg-accent-sky/10 text-accent-sky border border-accent-sky/30 font-medium shadow-[0_0_14px_rgba(56,189,248,0.08)]"
          : "border border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-secondary/70"
      }`}
    >
      {/* Subtle Active Accent Indicator on left edge when expanded */}
      {isActive && !isCollapsed && (
        <span
          className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-accent-sky shadow-[0_0_8px_rgba(56,189,248,0.6)]"
          aria-hidden="true"
        />
      )}

      {/* Item Icon */}
      <span
        className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none group-hover:scale-105 ${
          isActive ? "text-accent-sky" : "text-text-secondary group-hover:text-text-primary"
        }`}
        aria-hidden="true"
      >
        {Icon}
      </span>

      {/* Item Label (Hidden when collapsed) */}
      {!isCollapsed && (
        <span className="truncate text-xs sm:text-sm font-medium tracking-wide">
          {label}
        </span>
      )}
    </button>
  );
}
