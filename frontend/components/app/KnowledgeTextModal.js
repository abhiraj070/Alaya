"use client";

import { useState, useRef, useEffect } from "react";
import { useDialog } from "@/lib/use-dialog";

export default function KnowledgeTextModal({ item, onClose }) {
  const { dialogRef, cancelBtnRef } = useDialog({ busy: false, onClose });
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    const textToCopy = item?.content || "";
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="knowledge-text-title"
        className="flex max-h-[85dvh] w-full max-w-2xl flex-col rounded-2xl border border-border-strong bg-surface-primary p-5 sm:p-6 shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle pb-4">
          <div className="min-w-0 flex-1">
            <h2 id="knowledge-text-title" className="break-words text-base font-semibold text-text-primary">{item?.title || "Note"}</h2>
            <p className="mt-1 text-xs text-text-muted">{item?.category || "Note"}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky ${
                copied
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-border-subtle bg-surface-secondary/70 hover:bg-surface-secondary text-text-secondary hover:text-text-primary hover:border-accent-sky/30"
              }`}
              title={copied ? "Copied to clipboard!" : "Copy text"}
              aria-label="Copy text content"
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>

            <button ref={cancelBtnRef} type="button" onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky cursor-pointer">
              Close
            </button>
          </div>
        </div>
        <div tabIndex={0} className="chat-scrollbar min-h-0 overflow-y-auto whitespace-pre-wrap break-words py-4 text-sm leading-relaxed text-text-primary select-text">
          {item?.content}
        </div>
      </div>
    </div>
  );
}
