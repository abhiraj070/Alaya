"use client";

import { examplePrompts } from "@/mock/chat";

export default function ChatEmptyState({ onSelectPrompt }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 sm:py-12 select-none animate-fadeIn motion-reduce:animate-none">
      <div className="max-w-xl w-full mx-auto">
        {/* Brand Icon Badge */}
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-accent-sky/30 bg-surface-secondary text-accent-sky shadow-sm">
          <span className="font-extrabold text-base text-accent-sky">A</span>
        </div>

        {/* Heading & Supporting Text */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Ask your knowledge.
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
          Find answers across your documents and the information you&apos;ve saved with Alaya.
        </p>

        {/* Example Prompt Chips */}
        {onSelectPrompt && (
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
            {examplePrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onSelectPrompt(prompt)}
                className="w-full sm:w-auto text-center text-xs px-3 py-2 rounded-xl border border-border-subtle bg-surface-secondary/70 hover:bg-surface-secondary hover:border-accent-sky/40 text-text-secondary hover:text-text-primary transition-all duration-150 cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
