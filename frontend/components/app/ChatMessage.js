"use client";

/**
 * Safely parses and renders multiline Alaya responses into paragraphs,
 * numbered lists, and bulleted lists without using dangerouslySetInnerHTML.
 */
function renderAlayaResponse(text, isStreaming) {
  if (!text) {
    return isStreaming ? (
      <span className="inline-block text-accent-sky animate-pulse font-mono" aria-hidden="true">
        ▌
      </span>
    ) : null;
  }

  // Split into distinct blocks separated by multiple newlines
  const blocks = text.split(/\n\n+/);

  return (
    <>
      {blocks.map((block, blockIdx) => {
        const rawLines = block.split(/\n/);
        const trimmedLines = rawLines.map((l) => l.trim()).filter(Boolean);

        // Check if block is an ordered/numbered list (e.g. "1. item", "2. item")
        const isNumberedList =
          trimmedLines.length > 0 &&
          trimmedLines.every((line) => /^\d+\.\s+/.test(line));

        if (isNumberedList) {
          return (
            <ol
              key={blockIdx}
              className="list-decimal list-outside ml-5 space-y-1.5 my-2.5 text-text-primary text-sm sm:text-base leading-relaxed"
            >
              {trimmedLines.map((line, lineIdx) => (
                <li key={lineIdx} className="pl-1">
                  {line.replace(/^\d+\.\s+/, "")}
                </li>
              ))}
            </ol>
          );
        }

        // Check if block is an unordered/bullet list (e.g. "- item", "* item")
        const isBulletList =
          trimmedLines.length > 0 &&
          trimmedLines.every((line) => /^[-*•]\s+/.test(line));

        if (isBulletList) {
          return (
            <ul
              key={blockIdx}
              className="list-disc list-outside ml-5 space-y-1.5 my-2.5 text-text-primary text-sm sm:text-base leading-relaxed"
            >
              {trimmedLines.map((line, lineIdx) => (
                <li key={lineIdx} className="pl-1">
                  {line.replace(/^[-*•]\s+/, "")}
                </li>
              ))}
            </ul>
          );
        }

        // Standard paragraph with preserved internal line breaks
        const isLastBlock = blockIdx === blocks.length - 1;

        return (
          <p
            key={blockIdx}
            className="text-sm sm:text-base text-text-primary leading-relaxed mb-3 last:mb-0"
          >
            {rawLines.map((line, lineIdx) => (
              <span key={lineIdx}>
                {line}
                {lineIdx < rawLines.length - 1 && <br />}
              </span>
            ))}
            {isLastBlock && isStreaming && (
              <span
                className="inline-block text-accent-sky animate-pulse font-mono ml-0.5"
                aria-hidden="true"
              >
                ▌
              </span>
            )}
          </p>
        );
      })}
    </>
  );
}

export default function ChatMessage({ message }) {
  const isUser = message.sender === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 animate-fadeIn motion-reduce:animate-none">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-sm px-4 py-3 bg-surface-secondary/90 border border-border-strong text-text-primary text-sm sm:text-base leading-relaxed shadow-sm whitespace-pre-wrap break-words select-text">
          {message.text}
        </div>
      </div>
    );
  }

  // Alaya Response
  const isDocSource = message.source?.startsWith("Document");

  return (
    <div className="flex items-start gap-3 sm:gap-4 mb-6 animate-fadeIn motion-reduce:animate-none">
      {/* Alaya Brand Mark Icon */}
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

      {/* Structured Text Content */}
      <div className="flex-1 min-w-0 select-text">
        <div className="space-y-1">
          {renderAlayaResponse(message.text, message.isStreaming)}
        </div>

        {/* Source citation tag (shown when streaming completes) */}
        {!message.isStreaming && message.source && (
          <div className="mt-3 pt-2 border-t border-border-subtle/50 flex flex-wrap items-center gap-1.5 text-[11px] text-text-muted">
            <span className="text-accent-sky" aria-hidden="true">
              {isDocSource ? "📄" : "🧠"}
            </span>
            <span className="font-medium text-text-secondary">{message.source}</span>
            <span className="text-text-muted/60">· Simulated local match</span>
          </div>
        )}
      </div>
    </div>
  );
}
