import React from 'react';

/**
 * Minimalist glassmorphic cosmic card with subtle border and dark surface.
 */
export function Card({
  children,
  className = '',
  variant = 'surface',
  interactive = false,
  ...props
}) {
  const variantClasses = {
    surface: 'bg-[#0D1014]/90 backdrop-blur-md border border-[rgba(255,255,255,0.08)]',
    elevated: 'bg-[#11161B]/95 backdrop-blur-md border border-[rgba(255,255,255,0.12)] shadow-2xl',
    subtle: 'bg-[#080A0C]/80 backdrop-blur-sm border border-[rgba(255,255,255,0.05)]',
  };

  const interactiveClasses = interactive
    ? 'transition-all duration-200 hover:border-[rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.08)]'
    : '';

  return (
    <div
      className={`rounded-md p-4 text-[#F5F7FA] ${variantClasses[variant] || variantClasses.surface} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
