"use client";

import ChatMessage from "@/components/app/ChatMessage";

export default function ChatMessages({
  messages = [],
  isThinking = false,
  bottomRef,
}) {
  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {/* Subtle Alaya Thinking Indicator */}
      {isThinking && (
        <div
          className="flex items-start gap-3 sm:gap-4 mb-6 animate-fadeIn motion-reduce:animate-none"
          role="status"
          aria-live="polite"
        >
          <div
            className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl border border-accent-sky/30 bg-surface-secondary text-accent-sky shadow-sm mt-0.5"
            aria-label="Alaya"
          >
            <svg
              className="h-4 w-4"
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

          <div className="flex items-center gap-2.5 py-1.5 text-text-muted text-xs sm:text-sm">
            <div className="flex items-center gap-1" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-sky animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-accent-sky animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-accent-sky animate-bounce" />
            </div>
            <span className="text-text-secondary text-xs font-medium">
              Alaya is thinking...
            </span>
          </div>
        </div>
      )}

      {/* Bottom scroll target */}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
