import React, { useMemo } from 'react';
import { Compass, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { getRelatedChunks } from '../../utils/searchFilter.js';
import { Badge } from '../ui/Badge.jsx';

/**
 * Semantically Related Knowledge Explorer
 *
 * Discovers neighboring knowledge chunks using 3D UMAP coordinate proximity and cluster affiliation.
 * Allows one-click celestial navigation to related knowledge stars.
 */
export function RelatedKnowledgeSection({ currentNode, allNodes = [], onSelectRelatedStar }) {
  const relatedChunks = useMemo(() => {
    return getRelatedChunks(currentNode, allNodes, 4);
  }, [currentNode, allNodes]);

  if (relatedChunks.length === 0) {
    return (
      <div>
        <span className="text-[11px] text-[#737D89] block mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Semantically Related Knowledge</span>
        </span>
        <div className="bg-[#11161B] border border-[rgba(255,255,255,0.06)] rounded-md p-4 text-xs text-[#737D89] text-center ">
          No neighboring knowledge records found in this sector.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] text-[#737D89] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Semantically Related Knowledge</span>
        </span>
        <span className="text-[10px] text-[#737D89]">
          3D semantic proximity
        </span>
      </div>

      <div className="space-y-2">
        {relatedChunks.map(({ node, distance, sameCluster }) => (
          <div
            key={node.id}
            onClick={() => {
              if (typeof onSelectRelatedStar === 'function') {
                onSelectRelatedStar(node);
              }
            }}
            className="group bg-[#11161B] hover:bg-[#161C23] border border-[rgba(255,255,255,0.06)] hover:border-[#38BDF8]/40 rounded-md p-3 transition-all duration-150 cursor-pointer flex flex-col gap-1.5 shadow-sm"
          >
            {/* Header: Title and Proximity Pill */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#F5F7FA] group-hover:text-[#38BDF8] transition-colors truncate">
                {node.title}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {sameCluster && (
                  <Badge variant="sky" size="xs">
                    Sector Match
                  </Badge>
                )}
                <Badge variant={sameCluster ? 'success' : 'neutral'} size="xs">
                  {distance.toFixed(1)} units
                </Badge>
              </div>
            </div>

            {/* Excerpt preview */}
            <p className="text-[11px] text-[#737D89] group-hover:text-[#A1AAB5] line-clamp-2 leading-relaxed transition-colors">
              {node.preview}
            </p>

            {/* Footer: Source and Navigation Trigger */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[rgba(255,255,255,0.04)] text-[10px] text-[#737D89]">
              <div className="flex items-center gap-1.5 truncate">
                {node.has_source ? (
                  <FileText className="w-3 h-3 text-[#38BDF8] shrink-0" />
                ) : (
                  <Sparkles className="w-3 h-3 text-[#38BDF8] shrink-0" />
                )}
                <span className="truncate">{node.source_name || 'Direct Entry'}</span>
              </div>

              <span className="text-[#38BDF8] flex items-center gap-1 shrink-0 font-medium group-hover:translate-x-0.5 transition-transform">
                <Compass className="w-3 h-3" />
                <span>Fly to star</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RelatedKnowledgeSection;
