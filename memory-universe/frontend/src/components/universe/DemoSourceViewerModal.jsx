import React, { useEffect } from 'react';
import { FileText, X, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { universeProvider } from '../../data/universeProvider.js';

/**
 * Functional Demo Source Document Viewer
 *
 * Provides realistic document page inspection for sample documents in demo mode,
 * demonstrating verified chunk-to-page lineage without broken external links.
 */
export function DemoSourceViewerModal({ sourceName, pageNumber = 1, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const doc = universeProvider.getDemoSourceDocument(sourceName, pageNumber);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-doc-viewer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150"
    >
      <Card
        variant="elevated"
        className="max-w-2xl w-full bg-[#0D1014]/98 border border-[rgba(56,189,248,0.25)] shadow-[0_0_50px_rgba(0,0,0,0.9)] p-6 relative overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-[rgba(255,255,255,0.08)] select-none">
          <div className="flex items-center gap-2.5 truncate">
            <FileText className="w-5 h-5 text-[#38BDF8] shrink-0" />
            <div className="truncate">
              <h3 id="demo-doc-viewer-title" className="text-sm font-mono font-bold text-[#F5F7FA] truncate">
                {sourceName}
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#737D89]">
                <span>{doc.docType}</span>
                <span>•</span>
                <span className="text-[#38BDF8]">Page {pageNumber} of {doc.totalPages}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="sky" size="xs">
              DEMO SOURCE VIEWER
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose} icon={X} title="Close document preview" />
          </div>
        </div>

        {/* Informative lineage banner */}
        <div className="bg-[#11161B] border border-[rgba(255,255,255,0.06)] rounded-sm p-3 mb-4 text-xs text-[#A1AAB5] flex items-start gap-2 select-none">
          <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            In production, this action opens the real uploaded file on Cloudinary using standard browser PDF page fragments (<code className="text-[#38BDF8]">#page={pageNumber}</code>). In demo mode, this preview demonstrates verified page navigation using sample content.
          </p>
        </div>

        {/* Document Page Simulation Body */}
        <div className="flex-1 overflow-y-auto bg-[#080A0C] border border-[rgba(255,255,255,0.06)] rounded-md p-5 font-mono text-xs text-[#F5F7FA] leading-relaxed whitespace-pre-wrap select-text">
          {doc.excerpt}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-xs font-mono text-[#737D89] select-none">
          <span>LINEAGE: VERIFIED AT CHUNK INGESTION</span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Back to Universe
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default DemoSourceViewerModal;
