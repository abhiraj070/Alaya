import React from 'react';
import {
  RefreshCw,
  Orbit,
  ExternalLink,
  LogOut,
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
  isDemo = false,
  onExitDemo,
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
            <span className="text-xs font-bold text-[#F5F7FA]">
              ALAYA
            </span>
            <span className="text-[10px] text-[#737D89]">//</span>
            <span className="text-[11px] text-[#A1AAB5] hidden sm:inline">
              Memory Universe
            </span>
          </div>

          <div className="h-3 w-px bg-[rgba(255,255,255,0.08)] mx-0.5" />

          {/* Persistent DEMO Badge OR Online Status */}
          {isDemo ? (
            <div className="flex items-center gap-1.5" title="Sample universe · Your real memories appear when you exit the demo.">
              <Badge variant="warning" size="sm" dot dotColor="bg-[#F59E0B]">Demo</Badge>
              <span className="text-[10px] text-[#F59E0B] hidden lg:inline">Sample data</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5" title={connected ? "Backend API Connected" : "Backend API Unavailable"}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38BDF8]"></span>
              </span>
              <span className="text-[10px] text-[#737D89] hidden lg:inline">
                {connected ? "Online" : "Connecting"}
              </span>
            </div>
          )}
        </div>

        {/* Center: Search Control */}
        <div className="pointer-events-auto flex-1 max-w-sm sm:max-w-xl md:max-w-2xl flex justify-center">
          <SearchControl nodes={nodes} onSelectResult={onSelectSearchResult} />
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#0D1014]/80 backdrop-blur-md p-1 rounded-md border border-[rgba(255,255,255,0.08)] shadow-lg">
            {/* If in Demo mode, display Exit Demo button */}
            {isDemo && (
              <Button variant="ghost" size="sm" onClick={onExitDemo} icon={LogOut}
                title="Exit demonstration and return to real universe" className="text-[#F59E0B]">
                <span className="hidden sm:inline">Exit Demo</span>
              </Button>
            )}

            {/* Refresh Data (Queries real backend for knowledge updates) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading || recomputing}
              title={isDemo ? 'Check for real memories in backend' : 'Refresh universe nodes'}
              icon={RefreshCw}
              className={loading ? 'text-[#38BDF8]' : ''}
            >
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <div className="h-4 w-px bg-[rgba(255,255,255,0.08)] mx-0.5" />

            {/* Return to Alaya Chat / Knowledge Base */}
            <a
              href={ALAYA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#A1AAB5] hover:text-[#38BDF8] transition-colors rounded-sm"
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
