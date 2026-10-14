"use client";

export default function ChatEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 sm:py-12 select-none animate-fadeIn motion-reduce:animate-none">
      <div className="max-w-xl w-full mx-auto">
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
