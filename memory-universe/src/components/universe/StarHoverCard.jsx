import React, { useMemo } from 'react';
import { FileText, Sparkles, Image as ImageIcon, MousePointerClick } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';

/**
 * Compact Celestial Star Hover Preview Card
 *
 * Renders near the cursor when hovering over an active knowledge star.
 * Includes intelligent screen boundary detection and micro-interaction guidance.
 */
export function StarHoverCard({ node, position }) {
  if (!node || !position) return null;

  // Screen boundary clamping to keep tooltip within viewport
  const style = useMemo(() => {
    const cardWidth = 300;
    const cardHeight = 160;
    const padding = 16;

    let left = position.x + padding;
    let top = position.y + padding;

    // Flip horizontally if overflowing right edge
    if (typeof window !== 'undefined') {
      if (left + cardWidth > window.innerWidth - padding) {
        left = position.x - cardWidth - padding;
      }
      // Flip vertically if overflowing bottom edge
      if (top + cardHeight > window.innerHeight - padding) {
        top = position.y - cardHeight - padding;
      }

      // Hard clamp
      left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - cardHeight - padding));
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  }, [position]);

  const sourceIcon = useMemo(() => {
    if (node.source_type === 'docs') return FileText;
    if (node.source_type === 'img') return ImageIcon;
    return Sparkles;
  }, [node.source_type]);

  const SourceIconComponent = sourceIcon;

  return (
    <div
      style={style}
      className="fixed z-50 pointer-events-none select-none w-[300px] bg-[#0D1014]/95 backdrop-blur-xl border border-[rgba(56,189,248,0.3)] rounded-md shadow-[0_0_25px_rgba(0,0,0,0.8),0_0_15px_rgba(56,189,248,0.12)] p-3.5 transition-all duration-75 text-[#F5F7FA]"
    >
      {/* Top Header: Cluster Sector & Classification */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[rgba(255,255,255,0.06)]">
        <Badge variant="sky" size="xs">
          {node.cluster_name || (node.cluster_id !== null ? `Sector ${node.cluster_id}` : 'Celestial Star')}
        </Badge>
        <span className="text-[10px] font-mono text-[#737D89] uppercase tracking-wider truncate max-w-[120px]">
          {node.knowledge_type?.replace(/_/g, ' ') || 'Knowledge'}
        </span>
      </div>

      {/* Star Title */}
      <h4 className="text-xs font-mono font-semibold text-[#F5F7FA] mb-1.5 truncate">
        {node.title || 'Knowledge Chunk'}
      </h4>

      {/* Snippet preview */}
      <p className="text-[11px] font-sans text-[#A1AAB5] leading-relaxed line-clamp-3 mb-2.5">
        {node.preview}
      </p>

      {/* Footer: Source Lineage & Interaction Prompt */}
      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[rgba(255,255,255,0.06)] font-mono text-[10px]">
        <div className="flex items-center gap-1.5 text-[#737D89] truncate max-w-[170px]" title={node.source_name || 'Direct Knowledge Entry'}>
          <SourceIconComponent className="w-3 h-3 text-[#38BDF8] shrink-0" />
          <span className="truncate">
            {node.has_source && node.source_name ? node.source_name : 'Direct Entry'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[#38BDF8] shrink-0 font-medium">
          <MousePointerClick className="w-3 h-3 animate-pulse" />
          <span>Click to inspect</span>
        </div>
      </div>
    </div>
  );
}

export default StarHoverCard;
