"use client";

import { examplePrompts } from "@/mock/chat";

export default function ChatEmptyState({ onSelectPrompt, disabled = false }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 sm:py-12 select-none animate-fadeIn motion-reduce:animate-none">
      <div className="max-w-xl w-full mx-auto">
        {/* Minimalist Brand Graphic */}
        <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-border-strong bg-surface-secondary text-accent-sky shadow-[0_0_24px_rgba(56,189,248,0.15)] mb-4 sm:mb-5">
          <svg
            className="h-6 w-6 sm:h-7 sm:w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="12 2 22 12 12 22 2 12" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.8" />
          </svg>
        </div>

        {/* Heading & Supporting Text */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Ask your knowledge.
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
          Find answers across your documents and the information you&apos;ve saved with Alaya.
        </p>

        {/* Clickable Example Questions */}
        <div className="mt-8 space-y-2.5 max-w-md mx-auto text-left">
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider px-1">
            Suggested Queries
          </p>
          {examplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(prompt)}
              className="group flex items-center justify-between w-full px-4 py-3 rounded-xl border border-border-subtle bg-surface-secondary/50 hover:bg-surface-secondary hover:border-accent-sky/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer text-xs sm:text-sm text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky text-left shadow-sm"
            >
              <span className="truncate pr-3">{prompt}</span>
              <svg
                className="h-4 w-4 text-text-muted opacity-50 group-hover:opacity-100 group-hover:text-accent-sky group-hover:translate-x-0.5 transition-transform shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
