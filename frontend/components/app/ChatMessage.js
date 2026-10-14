"use client";

import { useState, useRef, useEffect } from "react";

/**
 * Safely parses and renders multiline Alaya responses into paragraphs,
 * numbered lists, and bulleted lists without using dangerouslySetInnerHTML.
 */
function renderAlayaResponse(text, isStreaming) {
  if (!text) {
    return isStreaming ? (
      <div className="flex items-center gap-2 py-1 text-text-muted text-xs sm:text-sm">
        <div className="flex items-center gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-sky animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-accent-sky animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-accent-sky animate-bounce" />
        </div>
        <span className="text-text-secondary text-xs font-medium">
          Alaya is thinking...
        </span>
      </div>
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

export default function ChatMessage({
  message,
  onEditMessage,
  onDeleteMessage,
}) {
  const isUser = message.sender === "user";

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || "");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = useRef(null);

  // Focus and select textarea on edit open
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleStartEdit = () => {
    setEditText(message.text || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text || "");
  };

  const handleSaveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed) return;

    if (trimmed === message.text) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onEditMessage) {
        await onEditMessage(message.id, trimmed);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to edit message:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (onDeleteMessage) {
      onDeleteMessage(message);
    }
  };

  if (isUser) {
    if (isEditing) {
      return (
        <div className="flex justify-end mb-6 w-full animate-fadeIn motion-reduce:animate-none">
          <div className="w-full max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-sm p-3.5 bg-surface-secondary border border-accent-sky/50 shadow-lg">
            <textarea
              ref={textareaRef}
              value={editText}
              disabled={isSubmitting}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  handleCancelEdit();
                }
              }}
              rows={Math.min(6, Math.max(2, editText.split("\n").length))}
              className="w-full bg-transparent text-text-primary text-sm sm:text-base leading-relaxed resize-none focus:outline-none placeholder:text-text-muted select-text"
              placeholder="Edit your message..."
            />
            <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSubmitting || !editText.trim()}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-accent-sky text-bg-primary hover:bg-accent-sky/90 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="group flex flex-col items-end mb-6 animate-fadeIn motion-reduce:animate-none">
        {/* User Message Bubble */}
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-sm px-4 py-3 bg-surface-secondary/90 border border-border-strong text-text-primary text-sm sm:text-base leading-relaxed shadow-sm whitespace-pre-wrap break-words select-text">
          {message.text}
        </div>

        {/* 3 Horizontal Action Icons below message (Copy, Edit, Delete) with premium spacing */}
        <div className="flex items-center justify-end gap-2 mt-1.5 pr-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
          {/* 1. Copy Icon Button */}
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy"}
            aria-label="Copy"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary/80 transition-colors cursor-pointer"
          >
            {copied ? (
              <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>

          {/* 2. Edit Icon Button */}
          <button
            type="button"
            onClick={handleStartEdit}
            title="Edit"
            aria-label="Edit"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary/80 transition-colors cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>

          {/* 3. Delete Icon Button */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            title={isDeleting ? "Deleting..." : "Delete"}
            aria-label="Delete"
            className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Alaya Response
  const isDocSource = message.source?.startsWith("Document");

  return (
    <div className="group flex items-start gap-3 sm:gap-4 mb-6 animate-fadeIn motion-reduce:animate-none">
      {/* Alaya Brand Avatar */}
      <div
        className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl border border-accent-sky/30 bg-surface-secondary text-accent-sky shadow-sm mt-0.5 select-none"
        aria-label="Alaya"
      >
        <span className="font-extrabold text-xs sm:text-sm text-accent-sky">A</span>
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

        {/* 2 Horizontal Action Icons below LLM response (Copy, Delete) with premium spacing */}
        {!message.isStreaming && message.text && (
          <div className="flex items-center justify-start gap-2 mt-2 pl-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
            {/* 1. Copy Icon Button */}
            <button
              type="button"
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy"}
              aria-label="Copy response"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary/80 transition-colors cursor-pointer"
            >
              {copied ? (
                <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>

            {/* 2. Delete Icon Button */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              title={isDeleting ? "Deleting..." : "Delete"}
              aria-label="Delete response"
              className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isDeleting ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
