import React from 'react';

/**
 * Micro-badge for displaying counts, statuses, and clusters.
 */
export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
  dot = false,
  dotColor = 'bg-[#38BDF8]',
}) {
  const variantClasses = {
    neutral: 'bg-[#11161B] text-[#A1AAB5] border border-[rgba(255,255,255,0.08)]',
    sky: 'bg-[rgba(56,189,248,0.1)] text-[#38BDF8] border border-[rgba(56,189,248,0.25)]',
    success: 'bg-[rgba(34,197,94,0.1)] text-[#22C55E] border border-[rgba(34,197,94,0.25)]',
    warning: 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.25)]',
    error: 'bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.25)]',
  };

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 rounded-xs',
    sm: 'text-xs px-2 py-0.5 rounded-sm',
    md: 'text-xs px-2.5 py-1 rounded-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono tracking-wider uppercase font-medium ${
        sizeClasses[size] || sizeClasses.sm
      } ${variantClasses[variant] || variantClasses.neutral} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {children}
    </span>
  );
}

export default Badge;
