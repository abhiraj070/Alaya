import React from 'react';
import {
  Sparkles,
  RefreshCw,
  Orbit,
  ExternalLink,
  Layers,
  Activity,
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { SearchControl } from './SearchControl.jsx';
import { ALAYA_URL } from '../../config.js';

/**
 * Top floating HUD for Memory Universe
 */
export function HeaderHUD({
  nodes = [],
  totalStars = 0,
  projectedCount = 0,
  clusterCount = 0,
  loading = false,
  recomputing = false,
  connected = true,
  onRefresh,
  onRecompute,
  onSelectSearchResult,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3 pointer-events-none select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & System Status */}
        <div className="pointer-events-auto flex items-center gap-3 bg-[#0D1014]/80 backdrop-blur-md px-3.5 py-2 rounded-md border border-[rgba(255,255,255,0.08)] shadow-lg shrink-0">
          <div className="flex items-center gap-2">
            <Orbit className="w-4 h-4 text-[#38BDF8] animate-[spin_12s_linear_infinite]" />
            <span className="font-mono text-xs font-bold tracking-widest text-[#F5F7FA]">
              ALAYA
            </span>
            <span className="text-[10px] font-mono text-[#737D89]">//</span>
            <span className="text-[11px] font-mono tracking-wider text-[#A1AAB5] hidden sm:inline">
              MEMORY UNIVERSE
            </span>
          </div>

          <div className="h-3 w-px bg-[rgba(255,255,255,0.08)] mx-0.5" />

          {/* Persistent DEMO Badge OR Online Status */}
          {(
            <div className="flex items-center gap-1.5" title={connected ? "Backend API Connected" : "Backend API Unavailable"}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38BDF8]"></span>
              </span>
              <span className="text-[10px] font-mono text-[#737D89] uppercase tracking-wider hidden lg:inline">
                {connected ? "ONLINE" : "CONNECTING"}
              </span>
            </div>
          )}
        </div>

        {/* Center: Search Control */}
        <div className="pointer-events-auto flex-1 max-w-xs sm:max-w-md flex justify-center">
          <SearchControl nodes={nodes} onSelectResult={onSelectSearchResult} />
        </div>

        {/* Action Controls & Telemetry */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Telemetry Readout & Metrics */}
          <div className="hidden xl:flex items-center gap-2 bg-[#0D1014]/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-[rgba(255,255,255,0.08)] shadow-lg">
            <Badge variant="sky" size="sm" dot dotColor="bg-[#38BDF8]">
              {totalStars} {totalStars === 1 ? 'Star' : 'Stars'}
            </Badge>

            {clusterCount > 0 && (
              <Badge variant="neutral" size="sm">
                <Layers className="w-3 h-3 text-[#A1AAB5]" />
                {clusterCount} {clusterCount === 1 ? 'Sector' : 'Sectors'}
              </Badge>
            )}

            <Badge
              variant={projectedCount === totalStars && totalStars > 0 ? 'success' : 'warning'}
              size="sm"
            >
              <Activity className="w-3 h-3" />
              {projectedCount}/{totalStars}
            </Badge>
          </div>

          <div className="flex items-center gap-2 bg-[#0D1014]/80 backdrop-blur-md p-1 rounded-md border border-[rgba(255,255,255,0.08)] shadow-lg">
            {/* If in Demo mode, display Exit Demo button */}
            {null}

            {/* Refresh Data (Queries real backend for knowledge updates) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading || recomputing}
              title={'Refresh universe nodes'}
              icon={RefreshCw}
              className={loading ? 'text-[#38BDF8]' : ''}
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* Realign / Recompute UMAP */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onRecompute}
              disabled={loading || recomputing || totalStars === 0}
              loading={recomputing}
              icon={Sparkles}
              title="Recompute 3D coordinates from embeddings"
            >
              <span className="hidden sm:inline">Realign</span>
            </Button>

            <div className="h-4 w-px bg-[rgba(255,255,255,0.08)] mx-0.5" />

            {/* Return to Alaya Chat / Knowledge Base */}
            <a
              href={ALAYA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-[#A1AAB5] hover:text-[#38BDF8] transition-colors rounded-sm"
              title="Open Alaya Knowledge Assistant"
            >
              <span className="hidden sm:inline">Alaya</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderHUD;
