"use client";

import { useRef, useEffect } from "react";

export default function ChatInput({
  value = "",
  onChange,
  onSubmit,
  disabled = false,
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea height to fit content up to maximum limit (180px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const nextHeight = Math.min(
        Math.max(textareaRef.current.scrollHeight, 52),
        180
      );
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    // Enter without Shift triggers send
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  const isSendDisabled = disabled || !value.trim();

  return (
    <div className="w-full shrink-0 px-3 sm:px-4 pb-4 pt-2 bg-gradient-to-t from-bg-primary via-bg-primary/95 to-transparent z-10 select-none">
      <div className="max-w-3xl mx-auto w-full">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isSendDisabled) onSubmit();
          }}
          style={{ outline: "none", boxShadow: "none" }}
          className={`relative flex items-end rounded-2xl border transition-all duration-200 outline-none focus:outline-none focus-visible:outline-none focus-within:outline-none ring-0 focus:ring-0 focus-within:ring-0 ${
            disabled
              ? "border-border-subtle bg-surface-primary/70 opacity-80"
              : "border-border-strong bg-surface-primary shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
          }`}
        >
          {/* Multiline Input Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "Alaya is generating a response..."
                : "Ask Alaya anything..."
            }
            style={{ outline: "none", boxShadow: "none" }}
            className="w-full bg-transparent px-4 py-3.5 pr-14 text-sm sm:text-base text-text-primary placeholder:text-text-muted outline-none focus:outline-none focus-visible:outline-none resize-none leading-relaxed font-sans max-h-44 min-h-[52px] overflow-y-auto disabled:cursor-not-allowed border-none ring-0 focus:ring-0"
            aria-label="Message composer"
          />

          {/* Send Button */}
          <div className="absolute right-2.5 bottom-2.5 flex items-center">
            <button
              type="submit"
              disabled={isSendDisabled}
              aria-label="Send message"
              title="Send message"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-sky text-bg-primary font-bold shadow-md hover:bg-accent-sky-light disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </form>

        {/* Minimal Subtext Disclaimer */}
        <p className="mt-2 text-center text-[11px] text-text-muted">
          Alaya answers questions based on your ingested documents and personal memories.
        </p>
      </div>
    </div>
  );
}
