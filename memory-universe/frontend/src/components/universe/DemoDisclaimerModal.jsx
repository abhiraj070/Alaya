import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from '../ui/Card.jsx';

/**
 * Welcome Modal
 *
 * Polished, minimal introduction to the 3D Memory Universe matching Alaya's design system.
 */
export function DemoDisclaimerModal({ onContinueToDemo, onNotNow }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onNotNow();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNotNow]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onNotNow();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none animate-in fade-in duration-150"
    >
      <Card
        variant="elevated"
        className="w-full max-w-[440px] bg-[#0D1014] border border-white/[0.08] shadow-2xl shadow-black/80 rounded-2xl p-5 sm:p-6 relative text-left"
      >
        {/* Subtle close button */}
        <button
          type="button"
          onClick={onNotNow}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-[#737D89] hover:text-[#F5F7FA] p-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#38BDF8]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-start pr-6">
          <h2
            id="welcome-modal-title"
            className="text-base sm:text-lg font-semibold text-[#F5F7FA] tracking-tight leading-snug"
          >
            Explore Your Memory Universe
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-[#A1AAB5] leading-relaxed">
            See your stored knowledge come together in an interactive 3D space. Discover connections between your memories.
          </p>

          <p className="mt-3 text-xs text-[#737D89] leading-relaxed">
            You&apos;re viewing sample data. Refresh to explore your own memories.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-4 mt-5 border-t border-white/[0.08] w-full">
          <button
            type="button"
            onClick={onNotNow}
            className="w-full sm:w-auto h-9 px-4 rounded-xl border border-white/[0.12] bg-[#11161B] hover:bg-[#161C23] text-xs font-medium text-[#A1AAB5] hover:text-[#F5F7FA] hover:border-white/[0.2] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#38BDF8] flex items-center justify-center"
          >
            Not now
          </button>

          <button
            type="button"
            onClick={onContinueToDemo}
            className="w-full sm:w-auto h-9 px-4 rounded-xl bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-xs font-semibold text-[#050505] transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#38BDF8] flex items-center justify-center"
          >
            Explore Universe
          </button>
        </div>
      </Card>
    </div>
  );
}

export default DemoDisclaimerModal;
