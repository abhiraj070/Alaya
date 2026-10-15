import React, { useEffect, useRef } from 'react';
import {
  X,
  FileText,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  Image as ImageIcon,
  BookOpen,
  Info,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { getSourceViewUrl, formatSourceLabel } from '../../utils/sourceDocument.js';
import { RelatedKnowledgeSection } from './RelatedKnowledgeSection.jsx';

/**
 * Slide-Out Knowledge Chunk Detail Drawer
 *
 * Provides complete inspection of a selected knowledge chunk:
 * - Verified source document navigation (#page=N support for PDFs in real mode)
 * - Safe whitespace-preserving content rendering
 * - Structured metadata inspector
 * - Semantic neighbor / related knowledge discovery
 * - Full keyboard accessibility (Escape to close)
 */
export function ChunkDetailDrawer({
  node,
  detail,
  allNodes = [],
  loading = false,
  error = null,
  onClose,
  onRetry,
  onSelectRelatedStar,
}) {
  const drawerRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!node) return null;

  const source = detail?.source;
  const pageNumber = detail?.page_number ?? null;
  const chunkIndex = detail?.chunk_index ?? null;
  const sourceViewUrl = getSourceViewUrl(source, pageNumber);

  // Format date
  const createdDate = detail?.created_at || node.created_at;
  const formattedDate = createdDate
    ? new Date(createdDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  // Filter dynamic metadata (exclude internal non-displayable properties)
  const metadataEntries = Object.entries(detail?.metadata || {}).filter(([, v]) => {
    return v !== null && v !== undefined && typeof v !== 'object';
  });

  return (
    <aside
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Knowledge Chunk Inspector"
      className="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] md:w-[480px] z-50 bg-[#0D1014]/95 backdrop-blur-2xl border-l border-[rgba(255,255,255,0.08)] shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col text-[#F5F7FA] transition-transform duration-300 ease-out select-text"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[rgba(255,255,255,0.08)] bg-[#080A0C]/60 select-none">
        <div className="flex items-center gap-2 truncate">
          <Badge variant="sky" size="sm">
            {node.cluster_name || (node.cluster_id !== null ? `Sector ${node.cluster_id}` : 'Celestial Star')}
          </Badge>
          <span className="text-xs text-[#737D89] capitalize truncate">
            {node.knowledge_type?.replace(/_/g, ' ') || 'Fact'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[10px] text-[#737D89] bg-[#11161B] px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.06)]">
            Esc
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            icon={X}
            title="Close inspector"
            className="hover:text-[#EF4444]"
          />
        </div>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Loading Skeleton */}
        {loading && !detail && (
          <div className="space-y-4 animate-pulse select-none">
            <div className="h-6 bg-[#161C23] rounded w-3/4" />
            <div className="h-4 bg-[#11161B] rounded w-1/2" />
            <div className="h-24 bg-[#11161B] rounded w-full mt-4" />
            <div className="h-40 bg-[#161C23] rounded w-full" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-[#1C1214] border border-[#EF4444]/30 rounded-md p-4 text-center">
            <AlertCircle className="w-6 h-6 text-[#EF4444] mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-[#EF4444] mb-1">
              Failed to load chunk details
            </h4>
            <p className="text-xs text-[#A1AAB5] mb-3">
              {error.message || 'The knowledge record could not be retrieved from the server.'}
            </p>
            <Button variant="secondary" size="sm" onClick={onRetry} icon={RefreshCw}>
              Retry Load
            </Button>
          </div>
        )}

        {/* Chunk Content and Lineage (when loaded) */}
        {detail && (
          <>
            {/* Title & Coordinate Lineage */}
            <div>
              <h3 className="text-base font-semibold text-[#F5F7FA] mb-2 leading-snug">
                {node.title || 'Knowledge Record'}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#737D89]">
                {formattedDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#A1AAB5]" />
                    <span>{formattedDate}</span>
                  </span>
                )}
                {chunkIndex !== null && (
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Chunk #{chunkIndex}</span>
                  </span>
                )}
                {pageNumber !== null && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Page {pageNumber}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Source Lineage Card */}
            <div className="bg-[#11161B] border border-[rgba(255,255,255,0.06)] rounded-md p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-[#737D89]">
                  Knowledge Origin
                </span>
                <span className="text-xs text-[#38BDF8] bg-[rgba(56,189,248,0.1)] px-2 py-0.5 rounded border border-[rgba(56,189,248,0.2)]">
                  {formatSourceLabel(source?.data_type || (node.has_source ? 'docs' : 'text'), source?.tag)}
                </span>
              </div>

              {/* Uploaded Document Source */}
              {source && source.data_type === 'docs' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-xs text-[#F5F7FA]">
                    <FileText className="w-4 h-4 text-[#38BDF8] shrink-0" />
                    <span className="truncate" title={node.source_name || 'Uploaded Document'}>
                      {node.source_name || 'Uploaded Document'}
                    </span>
                  </div>

                  {sourceViewUrl ? (
                    <a
                      href={sourceViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 w-full justify-center bg-[#161C23] hover:bg-[#1C232B] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(56,189,248,0.3)] text-xs font-medium text-[#38BDF8] py-2 px-3 rounded-sm transition-all duration-150 shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>
                        {pageNumber ? `Open Document at Page ${pageNumber}` : 'Open Original Document'}
                      </span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-[#737D89] italic block">
                      Source document link currently unavailable.
                    </span>
                  )}
                </div>
              )}

              {/* Uploaded Image Source */}
              {source && source.data_type === 'img' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-xs text-[#F5F7FA]">
                    <ImageIcon className="w-4 h-4 text-[#38BDF8] shrink-0" />
                    <span className="truncate">{node.source_name || 'Uploaded Image'}</span>
                  </div>

                  {sourceViewUrl && (
                    <a
                      href={sourceViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 w-full justify-center bg-[#161C23] hover:bg-[#1C232B] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(56,189,248,0.3)] text-xs font-medium text-[#38BDF8] py-2 px-3 rounded-sm transition-all duration-150 shadow-sm"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>View Original Image</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                    </a>
                  )}
                </div>
              )}

              {/* Direct Natural-Language Entry */}
              {(!source || source.data_type === 'text') && (
                <div className="flex items-start gap-2.5 text-xs text-[#A1AAB5]">
                  <Sparkles className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    This knowledge was ingested directly as natural-language text. No external file was uploaded.
                  </p>
                </div>
              )}
            </div>

            {/* Extracted Chunk Content */}
            <div>
              <span className="text-xs font-medium text-[#737D89] block mb-2">
                Chunk Text Content
              </span>
              <div className="bg-[#080A0C] border border-[rgba(255,255,255,0.06)] rounded-md p-4 text-xs text-[#F5F7FA] leading-relaxed whitespace-pre-wrap select-text max-h-[340px] overflow-y-auto">
                {detail.text_content}
              </div>
            </div>

            {/* Structured Metadata Inspector */}
            {metadataEntries.length > 0 && (
              <div>
                <span className="text-xs font-medium text-[#737D89] block mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Extracted Metadata</span>
                </span>
                <div className="grid grid-cols-2 gap-2 bg-[#11161B] border border-[rgba(255,255,255,0.06)] rounded-md p-3 text-xs">
                  {metadataEntries.map(([key, val]) => (
                    <div key={key} className="bg-[#080A0C] p-2 rounded-sm border border-[rgba(255,255,255,0.04)] truncate">
                      <span className="text-[10px] text-[#737D89] capitalize block truncate">{key}</span>
                      <span className="text-xs text-[#F5F7FA] font-medium truncate block">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Semantically Related Knowledge Explorer */}
            <RelatedKnowledgeSection
              currentNode={node}
              allNodes={allNodes}
              onSelectRelatedStar={onSelectRelatedStar}
            />
          </>
        )}
      </div>

      {/* Drawer Footer with Coordinates Telemetry */}
      <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.08)] bg-[#080A0C]/80 text-xs text-[#737D89] flex items-center justify-between select-none">
        <span>3D Position:</span>
        <span className="text-[#38BDF8]">
          [{node.x?.toFixed(2)}, {node.y?.toFixed(2)}, {node.z?.toFixed(2)}]
        </span>
      </div>
    </aside>
  );
}
