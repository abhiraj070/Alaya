import React from 'react';
import { Orbit, Plus, FileText, Sparkles, Compass } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { ALAYA_URL } from '../../config.js';

/**
 * Empty state displayed when authenticated user has no knowledge chunks in database
 */
export function EmptyState({ onExploreDemo }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 z-20 pointer-events-auto select-none">
      <Card
        variant="elevated"
        className="max-w-md w-full text-center border-[rgba(255,255,255,0.1)] p-8 relative overflow-hidden"
      >
        {/* Subtle decorative cosmic glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center">
          {/* Orbital icon graphic */}
          <div className="w-14 h-14 rounded-full bg-[#11161B] border border-[rgba(56,189,248,0.3)] flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
            <Orbit className="w-7 h-7 text-[#38BDF8] animate-[spin_20s_linear_infinite]" />
          </div>

          <h2 className="text-base font-semibold text-[#F5F7FA] mb-2">
            Void Detected // No Celestial Stars
          </h2>

          <p className="text-xs text-[#A1AAB5] leading-relaxed mb-6">
            Your Memory Universe is currently empty. Each star in this 3D cosmos represents
            an actual chunk of knowledge stored in your Alaya database.
          </p>

          <div className="w-full bg-[#080A0C] border border-[rgba(255,255,255,0.06)] rounded-sm p-3.5 mb-5 text-left">
            <span className="text-[11px] text-[#737D89] block mb-2">
              How to Populate Your Universe:
            </span>
            <ul className="text-xs text-[#A1AAB5] space-y-2">
              <li className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                <span>Upload PDFs, DOCX, or text files in Alaya.</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                <span>Feed facts or natural-language knowledge via chat.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2.5 w-full">
            <a
              href={ALAYA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#38BDF8] text-[#050505] text-xs font-semibold py-2 px-4 rounded-sm hover:bg-[#7DD3FC] transition-colors shadow-[0_0_15px_rgba(56,189,248,0.25)]"
            >
              <Plus className="w-4 h-4" />
              <span>Open Alaya to Add Knowledge</span>
            </a>
            <Button variant="secondary" size="md" onClick={onExploreDemo} icon={Compass} className="w-full">
              Explore Sample Demo Universe
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default EmptyState;
