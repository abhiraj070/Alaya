"use client";

import { useDialog } from "@/lib/use-dialog";

/**
 * DeleteKnowledgeItemModal
 * Premium, minimal confirmation dialog for knowledge base items matching Alaya's dark theme design system.
 */
export default function DeleteKnowledgeItemModal({
  item,
  isDeleting = false,
  error = "",
  onClose,
  onConfirm,
}) {
  const { dialogRef, cancelBtnRef } = useDialog({ busy: isDeleting, onClose });


  const itemType = item?.type || "item";
  let titleLabel = "Delete item?";
  let keepLabel = "Keep item";
  let deleteLabel = "Delete item";
  let typeLabel = "item";

  if (itemType === "document") {
    titleLabel = "Delete document?";
    keepLabel = "Keep document";
    deleteLabel = "Delete document";
    typeLabel = "document";
  } else if (itemType === "image") {
    titleLabel = "Delete image?";
    keepLabel = "Keep image";
    deleteLabel = "Delete image";
    typeLabel = "image";
  } else if (itemType === "memory") {
    titleLabel = "Delete note?";
    keepLabel = "Keep note";
    deleteLabel = "Delete note";
    typeLabel = "note";
  }

  const itemTitle = item?.title || "Untitled";

  // Click on backdrop to cancel safely
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-modal-backdrop motion-reduce:animate-none"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-knowledge-dialog-title"
        aria-describedby="delete-knowledge-dialog-desc"
        className="w-full max-w-[440px] rounded-2xl border border-white/[0.08] bg-[#0D1014] p-5 sm:p-6 shadow-2xl shadow-black/80 animate-modal-content motion-reduce:animate-none motion-reduce:transform-none select-none text-left"
      >
        {/* Header: Icon, Title, Dynamic Item Name & Description */}
        <div className="flex items-start gap-3.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-[#F87171]"
            aria-hidden="true"
          >
            <svg
              className="h-4.5 w-4.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <h3
              id="delete-knowledge-dialog-title"
              className="text-base font-semibold text-[#F5F7FA] tracking-tight leading-snug"
            >
              {titleLabel}
            </h3>

            {/* Dynamic Item Title */}
            <div className="mt-1.5 flex items-center">
              <span
                className="truncate max-w-full text-xs font-medium text-white bg-[#11161B] border border-white/[0.1] px-2.5 py-0.5 rounded-md"
                style={{ color: "#ffffff" }}
                title={itemTitle}
              >
                &ldquo;{itemTitle}&rdquo;
              </span>
            </div>

            {/* Description Warning */}
            <p
              id="delete-knowledge-dialog-desc"
              className="mt-2.5 text-xs text-[#A1AAB5] leading-relaxed"
            >
              This {typeLabel} and all its indexed knowledge, embeddings and memory visualization data will be permanently deleted.
            </p>
          </div>
        </div>

        {error && <p role="alert" className="mt-3 text-xs text-rose-400">{error}</p>}

        {/* Footer Actions: Keep & Delete */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-4 mt-5 border-t border-white/[0.08]">
          <button
            ref={cancelBtnRef}
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="w-full sm:w-auto h-9 px-4 rounded-xl border border-white/[0.12] bg-[#11161B] hover:bg-[#161C23] text-xs font-medium text-white hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky disabled:opacity-50 flex items-center justify-center"
            style={{ color: "#ffffff" }}
          >
            {keepLabel}
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="w-full sm:w-auto h-9 px-4 rounded-xl border border-red-500/40 bg-red-600/90 hover:bg-red-600 active:bg-red-700 text-xs font-semibold text-white transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <div
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden="true"
                />
                <span>Deleting...</span>
              </>
            ) : (
              <span>{deleteLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
