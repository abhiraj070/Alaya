"use client";

/**
 * Derives uppercase initials from any full name string.
 * Examples: "Abhiraj Sharma" -> "AS", "Alex Mercer" -> "AM", "Alaya" -> "AL"
 */
export function getInitials(name) {
  if (!name || typeof name !== "string") return "A";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Shared User Avatar component displaying dynamically calculated initials.
 */
export default function UserAvatar({
  name = "Abhiraj Sharma",
  size = "md",
  className = "",
}) {
  const initials = getInitials(name);

  const sizeClasses = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-base",
    xl: "h-20 w-20 text-2xl",
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-secondary text-accent-sky font-semibold tracking-wider select-none shadow-sm transition-all duration-200 group-hover:border-accent-sky/40 group-hover:shadow-[0_0_12px_rgba(56,189,248,0.2)] ${selectedSize} ${className}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
