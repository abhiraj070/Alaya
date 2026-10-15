"use client";

/**
 * Derives uppercase initials from any full name string.
 * Examples: "Your profile" -> "AS", "Alex Mercer" -> "AM", "Alaya" -> "AL"
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
  name = "Your profile",
  size = "md",
  className = "",
}) {
  const initials = getInitials(name);

  const sizeClasses = {
    sm: "h-8 w-8 text-[11px] tracking-wide",
    md: "h-9 w-9 text-xs tracking-wide",
    lg: "h-12 w-12 text-base tracking-wide",
    xl: "h-24 w-24 sm:h-28 sm:w-28 text-3xl sm:text-4xl tracking-normal",
    "2xl": "h-28 w-28 sm:h-32 sm:w-32 text-4xl sm:text-5xl tracking-normal",
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-secondary text-accent-sky font-bold leading-none select-none shadow-sm transition-all duration-200 group-hover:border-accent-sky/40 group-hover:shadow-[0_0_16px_rgba(56,189,248,0.25)] ${selectedSize} ${className}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
