import React, { useMemo } from 'react';
import { Filter, X, FileText, Layers, Tag } from 'lucide-react';
import {
  getDistinctSources,
  getDistinctClusters,
  getDistinctKnowledgeTypes,
} from '../../utils/searchFilter.js';
import { Badge } from '../ui/Badge.jsx';

/**
 * Multifaceted Filter Controls Bar
 *
 * Provides real-time filtering by source document, semantic cluster, and knowledge type.
 */
export function UniverseFilterBar({
  nodes = [],
  filteredCount = 0,
  filters = { source: 'all', cluster: 'all', knowledgeType: 'all' },
  onSetFilter,
  onClearFilters,
}) {
  const sources = useMemo(() => getDistinctSources(nodes), [nodes]);
  const clusters = useMemo(() => getDistinctClusters(nodes), [nodes]);
  const knowledgeTypes = useMemo(() => getDistinctKnowledgeTypes(nodes), [nodes]);

  const hasActiveFilters =
    filters.source !== 'all' || filters.cluster !== 'all' || filters.knowledgeType !== 'all';

  return (
    <div className="fixed top-14 left-0 right-0 z-30 px-4 pointer-events-none select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Filter Pills Group */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 bg-[#0D1014]/85 backdrop-blur-md p-1.5 rounded-md border border-[rgba(255,255,255,0.08)] shadow-lg text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2 text-[#737D89]">
            <Filter className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="hidden sm:inline">FILTER:</span>
          </div>

          {/* 1. Source Document Dropdown */}
          {sources.length > 0 && (
            <div className="relative inline-flex items-center">
              <select
                aria-label="Filter by source document"
                value={filters.source}
                onChange={(e) => onSetFilter('source', e.target.value)}
                className={`bg-[#11161B] text-xs font-mono py-1 px-2.5 rounded-sm border outline-none cursor-pointer transition-colors ${
                  filters.source !== 'all'
                    ? 'border-[#38BDF8] text-[#38BDF8] bg-[rgba(56,189,248,0.08)] font-semibold'
                    : 'border-[rgba(255,255,255,0.08)] text-[#A1AAB5] hover:border-[rgba(56,189,248,0.3)]'
                }`}
              >
                <option value="all">All Sources ({nodes.length})</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Semantic Cluster Dropdown */}
          {clusters.length > 0 && (
            <div className="relative inline-flex items-center">
              <select
                aria-label="Filter by semantic sector"
                value={filters.cluster}
                onChange={(e) => onSetFilter('cluster', e.target.value)}
                className={`bg-[#11161B] text-xs font-mono py-1 px-2.5 rounded-sm border outline-none cursor-pointer transition-colors ${
                  filters.cluster !== 'all'
                    ? 'border-[#38BDF8] text-[#38BDF8] bg-[rgba(56,189,248,0.08)] font-semibold'
                    : 'border-[rgba(255,255,255,0.08)] text-[#A1AAB5] hover:border-[rgba(56,189,248,0.3)]'
                }`}
              >
                <option value="all">All Sectors ({clusters.length})</option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Knowledge Type Dropdown */}
          {knowledgeTypes.length > 0 && (
            <div className="relative inline-flex items-center hidden md:inline-flex">
              <select
                aria-label="Filter by knowledge classification"
                value={filters.knowledgeType}
                onChange={(e) => onSetFilter('knowledgeType', e.target.value)}
                className={`bg-[#11161B] text-xs font-mono py-1 px-2.5 rounded-sm border outline-none cursor-pointer transition-colors ${
                  filters.knowledgeType !== 'all'
                    ? 'border-[#38BDF8] text-[#38BDF8] bg-[rgba(56,189,248,0.08)] font-semibold'
                    : 'border-[rgba(255,255,255,0.08)] text-[#A1AAB5] hover:border-[rgba(56,189,248,0.3)]'
                }`}
              >
                <option value="all">All Classifications</option>
                {knowledgeTypes.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-[#161214] text-[#EF4444] border border-[#EF4444]/30 hover:border-[#EF4444] hover:bg-[#251316] transition-colors cursor-pointer text-[11px]"
              title="Clear all active filters"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Dynamic Filter Telemetry Tag */}
        {hasActiveFilters && (
          <div className="pointer-events-auto bg-[#0D1014]/85 backdrop-blur-md px-3 py-1.5 rounded-md border border-[rgba(255,255,255,0.08)] text-xs font-mono text-[#737D89]">
            <span>SHOWING: </span>
            <span className="text-[#38BDF8] font-bold">{filteredCount}</span>
            <span> / {nodes.length} STARS</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default UniverseFilterBar;
