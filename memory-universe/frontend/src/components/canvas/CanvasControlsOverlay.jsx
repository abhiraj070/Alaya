import React from 'react';
import { Target, Globe, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

/**
 * Unobtrusive Floating Canvas Controls Overlay
 */
export function CanvasControlsOverlay({
  onResetCamera,
  gridVisible = true,
  onToggleGrid,
  bloomEnabled = true,
  onToggleBloom,
}) {
  return (
    <>
      {/* Bottom-Left Controls Bar */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto flex items-center gap-2">
        {/* Reset Camera View */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onResetCamera}
          icon={Target}
          title="Reset camera vantage point (0, 25, 75)"
          className="bg-[#0D1014]/90 backdrop-blur-md"
        >
          <span className="hidden sm:inline">Reset View</span>
        </Button>

        {/* Toggle Celestial Grid */}
        <Button
          variant={gridVisible ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleGrid}
          icon={Globe}
          title={gridVisible ? 'Hide celestial coordinate rings' : 'Show celestial coordinate rings'}
          className="bg-[#0D1014]/90 backdrop-blur-md"
        >
          <span className="hidden md:inline">Grid</span>
        </Button>

        {/* Toggle Postprocessing Bloom */}
        <Button
          variant={bloomEnabled ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleBloom}
          icon={Sparkles}
          title={bloomEnabled ? 'Disable bloom post-processing' : 'Enable bloom post-processing'}
          className="bg-[#0D1014]/90 backdrop-blur-md"
        >
          <span className="hidden md:inline">Bloom</span>
        </Button>
      </div>
    </>
  );
}
