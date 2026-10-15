import React from 'react';
import { AlertCircle, Clock, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

/**
 * Contextual status banner for unprojected chunks, in-flight calculation, or errors
 */
export function StatusBanner({
  unprojectedCount = 0,
  recomputing = false,
  onRecompute,
}) {
  if (recomputing) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div className="flex items-center gap-3 bg-[#0D1014]/95 border border-[#38BDF8]/40 px-4 py-2.5 rounded-md shadow-2xl backdrop-blur-md">
          <Clock className="w-4 h-4 text-[#38BDF8] animate-spin" />
          <span className="text-xs text-[#F5F7FA]">
            UMAP 3D Dimensionality Reduction in progress...
          </span>
        </div>
      </div>
    );
  }

  if (unprojectedCount > 0) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-md w-full px-4">
        <div className="flex items-center justify-between gap-3 bg-[#0D1014]/95 border border-[#F59E0B]/40 p-3 rounded-md shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <div className="text-xs text-[#F5F7FA]">
              <span>{unprojectedCount} knowledge {unprojectedCount === 1 ? 'chunk awaits' : 'chunks await'} projection.</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={onRecompute}
            icon={Sparkles}
          >
            Project
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
