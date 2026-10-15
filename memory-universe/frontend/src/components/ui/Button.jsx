import React from 'react';

/**
 * Minimalist cosmic UI button supporting primary, secondary, and ghost variants.
 */
export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  title,
  icon: Icon,
  ...props
}) {
  const baseClasses =
    'relative inline-flex items-center justify-center font-medium transition-all duration-200 select-none outline-none focus-visible:ring-1 focus-visible:ring-[#38BDF8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 rounded-sm gap-1.5',
    md: 'text-xs px-3.5 py-1.5 rounded-sm gap-2',
    lg: 'text-sm px-4 py-2 rounded-md gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#38BDF8] text-[#050505] font-semibold hover:bg-[#7DD3FC] shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] border border-[#7DD3FC]/50',
    secondary:
      'bg-[#0D1014] text-[#F5F7FA] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(56,189,248,0.3)] hover:text-[#38BDF8] hover:bg-[#11161B]',
    ghost:
      'bg-transparent text-[#A1AAB5] hover:text-[#F5F7FA] hover:bg-[rgba(255,255,255,0.04)] border border-transparent',
    danger:
      'bg-[#161214] text-[#EF4444] border border-[#EF4444]/30 hover:border-[#EF4444] hover:bg-[#251316]',
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.secondary
      } ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

export default Button;
