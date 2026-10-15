import React from 'react';

/**
 * Cosmic rotating ring spinner with glow effect.
 */
export function Spinner({ size = 'md', className = '', label = null }) {
  const sizeMap = {
    sm: 'w-4 h-4 border',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-2',
    xl: 'w-14 h-14 border-[3px]',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer ambient glow */}
        <div
          className={`${sizeMap[size] || sizeMap.md} rounded-full border-[#38BDF8]/20 animate-ping absolute inset-0 opacity-20`}
        />
        {/* Core rotating ring */}
        <div
          className={`${sizeMap[size] || sizeMap.md} rounded-full border-[rgba(255,255,255,0.08)] border-t-[#38BDF8] animate-spin`}
          style={{ animationDuration: '0.9s' }}
        />
      </div>
      {label && (
        <span className="text-xs font-mono text-[#A1AAB5] tracking-widest uppercase">
          {label}
        </span>
      )}
    </div>
  );
}

export default Spinner;
