import React, { useEffect } from 'react';
import { Orbit, AlertCircle, ArrowRight, X } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

/**
 * Demo Disclaimer Modal
 *
 * Introduces the sample universe before entering demo mode.
 */
export function DemoDisclaimerModal({ onContinueToDemo, onNotNow }) {
  // Close on Escape -> invokes onNotNow
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onNotNow();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNotNow]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-disclaimer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200"
    >
      <Card
        variant="elevated"
        className="max-w-lg w-full bg-[#0D1014]/98 border border-[rgba(56,189,248,0.3)] shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(56,189,248,0.12)] p-6 sm:p-8 relative overflow-hidden"
      >
        {/* Ambient celestial background glow */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Close button (defaults to Not Now) */}
        <button
          type="button"
          onClick={onNotNow}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-[#737D89] hover:text-[#F5F7FA] p-1 rounded transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative flex flex-col items-start text-left">
          {/* Header pill & icon */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#11161B] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
              <Orbit className="w-4 h-4 animate-[spin_10s_linear_infinite]" />
            </div>
            <Badge variant="sky" size="sm" dot dotColor="bg-[#38BDF8]">
              Interactive demonstration
            </Badge>
          </div>

          <h2
            id="demo-disclaimer-title"
            className="text-lg sm:text-xl font-bold text-[#F5F7FA] mb-2"
          >
            Explore Your Memory Universe
          </h2>

          <p className="text-xs sm:text-sm text-[#A1AAB5] leading-relaxed mb-5">
            Discover how Alaya turns stored knowledge into an interactive 3D universe. Explore the demo to see how your memories will appear, connect, and become searchable.
          </p>

          {/* Important Disclaimer Alert Box */}
          <div className="w-full bg-[#11161B] border border-[#F59E0B]/30 rounded-md p-3.5 sm:p-4 mb-6">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-[#F59E0B] block">
                  Important Disclaimer
                </span>
                <p className="text-xs text-[#A1AAB5] leading-relaxed">
                  This universe contains fictional sample data created for demonstration. These are not your actual memories. Use Refresh to check for your real knowledge, or Exit Demo to return to your universe.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full">
            <Button
              variant="ghost"
              size="md"
              onClick={onNotNow}
              className="w-full sm:w-auto"
            >
              Not Now
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={onContinueToDemo}
              icon={ArrowRight}
              className="w-full sm:w-auto"
            >
              Continue to Demo
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DemoDisclaimerModal;
