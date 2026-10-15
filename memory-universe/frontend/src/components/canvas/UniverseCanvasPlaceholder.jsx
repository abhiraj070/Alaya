import React from 'react';
import { Compass, Eye, ShieldCheck, Box } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';

/**
 * Foundational 3D Canvas Placeholder
 *
 * Dominates the screen with a deep-black space environment, celestial reticle,
 * orbital rings, coordinate telemetry, and architectural readiness for Phase 5's
 * React Three Fiber / Three.js celestial engine.
 */
export function UniverseCanvasPlaceholder({
  nodes = [],
  totalStars = 0,
  isProjected = true,
  clusters = [],
}) {
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#050505] bg-cosmic-grid select-none flex items-center justify-center">
      {/* Ambient Celestial Glow in center */}
      <div className="absolute w-[600px] h-[600px] bg-[#38BDF8]/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Concentric Orbital Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Outer Ring */}
        <div className="w-[720px] h-[720px] rounded-full border border-[rgba(255,255,255,0.03)] flex items-center justify-center animate-celestial-pulse">
          {/* Mid Ring */}
          <div className="w-[480px] h-[480px] rounded-full border border-[rgba(56,189,248,0.06)] border-dashed flex items-center justify-center">
            {/* Inner Ring */}
            <div className="w-[240px] h-[240px] rounded-full border border-[rgba(255,255,255,0.05)] flex items-center justify-center">
              {/* Origin Marker */}
              <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_12px_#38BDF8]" />
            </div>
          </div>
        </div>

        {/* Crosshair Axes */}
        <div className="absolute w-[600px] h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent" />
        <div className="absolute h-[600px] w-px bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.06)] to-transparent" />
      </div>

      {/* Central Celestial Status Badge */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm px-6 py-4 bg-[#0D1014]/60 backdrop-blur-md rounded-md border border-[rgba(255,255,255,0.06)] shadow-2xl">
        <div className="flex items-center gap-2 mb-2 text-[#38BDF8]">
          <Box className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-mono font-semibold tracking-widest uppercase">
            3D Celestial Space Active
          </span>
        </div>

        <p className="text-[11px] text-[#A1AAB5] font-sans leading-relaxed mb-3">
          Memory Universe frontend scaffolding initialized. Connected to FastAPI backend with {nodes.length} stars loaded.
        </p>

        <div className="flex items-center gap-2">
          <Badge variant="sky" size="xs">
            Vite + React
          </Badge>
          <Badge variant="neutral" size="xs">
            Three.js / R3F Ready
          </Badge>
          <Badge variant="success" size="xs">
            UMAP 3D
          </Badge>
        </div>
      </div>

      {/* Bottom-Left Telemetry Coordinates HUD */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-[#0D1014]/80 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2.5 font-mono text-[11px] text-[#737D89] space-y-1">
        <div className="flex items-center gap-2 text-[#A1AAB5] font-medium uppercase tracking-wider mb-1.5 pb-1 border-b border-[rgba(255,255,255,0.06)]">
          <Compass className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Coordinate System</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>ORIGIN:</span>
          <span className="text-[#F5F7FA]">[0.00, 0.00, 0.00]</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>SPHERE RADIUS:</span>
          <span className="text-[#F5F7FA]">~40.0 UNITS</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>PROJECTION:</span>
          <span className="text-[#38BDF8]">UMAP-3D (COSINE)</span>
        </div>
      </div>

      {/* Bottom-Right Node Telemetry */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto bg-[#0D1014]/80 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-md px-3.5 py-2.5 font-mono text-[11px] text-[#737D89] space-y-1 max-w-xs">
        <div className="flex items-center justify-between gap-4 text-[#A1AAB5] font-medium uppercase tracking-wider mb-1.5 pb-1 border-b border-[rgba(255,255,255,0.06)]">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Nodes Telemetry</span>
          </span>
          <span className="text-[#38BDF8]">{nodes.length} Ready</span>
        </div>

        <div className="flex justify-between gap-4">
          <span>TOTAL CHUNKS:</span>
          <span className="text-[#F5F7FA]">{totalStars}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>CLUSTERS DETECTED:</span>
          <span className="text-[#F5F7FA]">{clusters.length}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>PIPELINE:</span>
          <span className="text-[#22C55E] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> VERIFIED
          </span>
        </div>
      </div>
    </div>
  );
}

export default UniverseCanvasPlaceholder;
