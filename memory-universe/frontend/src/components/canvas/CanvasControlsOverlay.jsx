import React from 'react';
import { Target, Globe, Sparkles, Compass } from 'lucide-react';
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
  nodeCount = 0,
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

      {/* Bottom-Right Coordinates Telemetry Badge */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto hidden sm:flex items-center gap-2 bg-[#0D1014]/90 backdrop-blur-md px-3 py-1.5 rounded-sm border border-[rgba(255,255,255,0.08)] text-xs text-[#737D89]">
        <Compass className="w-3.5 h-3.5 text-[#38BDF8]" />
        <span>3D Space:</span>
        <span className="text-[#F5F7FA]">{nodeCount} Stars</span>
        <span className="text-[#38BDF8]">·</span>
        <span>R: 40.0</span>
      </div>
    </>
  );
}
