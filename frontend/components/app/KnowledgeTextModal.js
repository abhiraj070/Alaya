"use client";

import { useDialog } from "@/lib/use-dialog";

export default function KnowledgeTextModal({ item, onClose }) {
  const { dialogRef, cancelBtnRef } = useDialog({ busy: false, onClose });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="knowledge-text-title"
        className="flex max-h-[85dvh] w-full max-w-2xl flex-col rounded-2xl border border-border-strong bg-surface-primary p-5 sm:p-6 shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle pb-4">
          <div className="min-w-0">
            <h2 id="knowledge-text-title" className="break-words text-base font-semibold text-text-primary">{item.title}</h2>
            <p className="mt-1 text-xs text-text-muted">{item.category || "Note"}</p>
          </div>
          <button ref={cancelBtnRef} type="button" onClick={onClose}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky">
            Close
          </button>
        </div>
        <div tabIndex={0} className="chat-scrollbar min-h-0 overflow-y-auto whitespace-pre-wrap break-words py-4 text-sm leading-relaxed text-text-primary select-text">
          {item.content}
        </div>
      </div>
    </div>
  );
}
