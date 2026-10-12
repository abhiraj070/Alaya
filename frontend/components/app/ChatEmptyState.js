"use client";

export default function ChatEmptyState() {
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
      </div>
    </div>
  );
}
