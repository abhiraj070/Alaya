"use client";

import { useState } from "react";
import KnowledgeTextModal from "@/components/app/KnowledgeTextModal";
import ChatInput from "@/components/app/ChatInput";
import DeleteKnowledgeItemModal from "@/components/app/DeleteKnowledgeItemModal";
import KnowledgeCard from "@/components/app/KnowledgeCard";
import { getExtBadgeStyle } from "@/lib/knowledge-presentation";
import { useKnowledgeBase } from "@/lib/use-knowledge-base";

export default function KnowledgeBaseManager({ onUploadQueued }) {
  const [openedText, setOpenedText] = useState(null);
  const {
    items, toast, setToast, activeInputMode, setActiveInputMode, stagedFile, isFileDragging, setIsFileDragging,
    isFilesProcessing, fileProcessingStep, fileError, fileInputRef, handleFileSelected, handleIngestFileSubmit,
    stagedImage, isImageDragging, setIsImageDragging, isImagesProcessing, imageProcessingStep, imageError,
    imageInputRef, handleImageSelected, handleIndexImageSubmit, textValue, setTextValue, selectedTag, setSelectedTag,
    isTextSubmitting, textError, setTextError, tagsList, handleTextSubmit, activeFilter, setActiveFilter, searchQuery, setSearchQuery,
    docCount, imgCount, memCount, filteredItems, searchInputRef, itemToDelete, setItemToDelete, isDeletingItem,
    handleConfirmDelete, isLoadingUploads, deleteError,
  } = useKnowledgeBase(onUploadQueued);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Header - No horizontal bar below */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Knowledge Base
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Feed information to Alaya through files, images, or natural-language memories. Everything is unified into your personal knowledge index.
        </p>
      </div>

      {/* Global Toast Feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center justify-between rounded-xl border p-4 text-xs font-mono transition-all animate-fadeIn ${
            toast.type === "error"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : toast.type === "info"
              ? "border-border-accent bg-surface-secondary text-text-secondary"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{toast.type === "error" ? "⚠" : toast.type === "info" ? "ℹ" : "✓"}</span>
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="hover:opacity-75 transition-opacity px-2 py-0.5 text-xs"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 1: THREE KNOWLEDGE INPUT MODES                               */}
      {/* Segmented Control / Tabs                                             */}
      {/* ==================================================================== */}
      <section className="rounded-2xl border border-border-strong bg-surface-primary p-5 sm:p-6 shadow-sm">
        {/* Input Mode Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              Add New Knowledge
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Choose an input mode to index new material into Alaya.
            </p>
          </div>

          {/* Mode Selector Segmented Control */}
          <div
            role="tablist"
            aria-label="Knowledge input modes"
            className="inline-flex rounded-xl bg-surface-secondary p-1 border border-border-subtle"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeInputMode === "files"}
              onClick={() => setActiveInputMode("files")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeInputMode === "files"
                  ? "bg-surface-primary text-accent-sky shadow-sm border border-accent-sky/30"
                  : "text-text-muted hover:text-text-primary border border-transparent"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Upload Files</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeInputMode === "images"}
              onClick={() => setActiveInputMode("images")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeInputMode === "images"
                  ? "bg-surface-primary text-accent-sky shadow-sm border border-accent-sky/30"
                  : "text-text-muted hover:text-text-primary border border-transparent"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Upload Images</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeInputMode === "text"}
              onClick={() => setActiveInputMode("text")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeInputMode === "text"
                  ? "bg-surface-primary text-accent-sky shadow-sm border border-accent-sky/30"
                  : "text-text-muted hover:text-text-primary border border-transparent"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Write Text</span>
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* MODE 1: UPLOAD FILES INTERFACE                                   */}
        {/* Single document upload at a time                                 */}
        {/* ================================================================ */}
        {activeInputMode === "files" && (
          <div className="mt-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Supports PDF, DOCX, TXT, XLSX, PPTX</span>
              <span className="font-mono">Max 25 MB</span>
            </div>

            {/* Error Message */}
            {fileError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 font-mono">
                ⚠ {fileError}
              </div>
            )}

            {/* If no file is staged, show Drop Zone. If 1 file is uploaded, remove option to upload new */}
            {!stagedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsFileDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsFileDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsFileDragging(false);
                  handleFileSelected(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
                  isFileDragging
                    ? "border-accent-sky bg-accent-sky/10"
                    : "border-border-strong hover:border-accent-sky/60 bg-surface-secondary/40 hover:bg-surface-secondary/70"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.csv,.xlsx,.pptx"
                  onChange={(e) => handleFileSelected(e.target.files)}
                  className="hidden"
                  id="doc-file-input"
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-subtle bg-surface-primary text-accent-sky group-hover:scale-105 transition-transform">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>

                <p className="mt-3 text-sm font-semibold text-text-primary">
                  Drag and drop your document file here, or <span className="text-accent-sky underline underline-offset-4">browse</span>
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Document files only. For images, please use the Upload Images tab.
                </p>
              </div>
            ) : (
              /* When 1 file is uploaded, show the single file card (option to upload new is removed) */
              <div className="rounded-xl border border-border-subtle bg-surface-secondary/40 p-4 space-y-3">
                <div className="text-xs font-semibold text-text-secondary">
                  <span>Selected Document</span>
                </div>

                <div className="flex items-center py-2 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${getExtBadgeStyle(
                        stagedFile.fileType
                      )}`}
                    >
                      {stagedFile.fileType}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">
                        {stagedFile.name}
                      </p>
                      <p className="text-[10px] text-text-muted font-mono">
                        {stagedFile.size}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ingest Action Button */}
                <div className="pt-2 flex items-center justify-between border-t border-border-subtle">
                  <div className="text-xs text-text-muted font-mono">
                    {isFilesProcessing ? (
                      <span className="text-accent-sky animate-pulse">{fileProcessingStep}</span>
                    ) : (
                      <span>Ready to ingest document</span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isFilesProcessing}
                    onClick={handleIngestFileSubmit}
                    className="btn-primary h-9 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                  >
                    {isFilesProcessing && (
                      <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    )}
                    <span>{isFilesProcessing ? "Ingesting..." : "Ingest Document"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* MODE 2: UPLOAD IMAGES INTERFACE                                  */}
        {/* Single image upload at a time                                    */}
        {/* ================================================================ */}
        {activeInputMode === "images" && (
          <div className="mt-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Supports PNG, JPG, JPEG, WebP</span>
              <span className="font-mono">Max 2 MB</span>
            </div>

            {/* Error Message */}
            {imageError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 font-mono">
                ⚠ {imageError}
              </div>
            )}

            {/* If no image is staged, show Drop Zone. If 1 image is uploaded, remove option to upload new */}
            {!stagedImage ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsImageDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsImageDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsImageDragging(false);
                  handleImageSelected(e.dataTransfer.files);
                }}
                onClick={() => imageInputRef.current?.click()}
                className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
                  isImageDragging
                    ? "border-accent-sky bg-accent-sky/10"
                    : "border-border-strong hover:border-accent-sky/60 bg-surface-secondary/40 hover:bg-surface-secondary/70"
                }`}
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => handleImageSelected(e.target.files)}
                  className="hidden"
                  id="image-file-input"
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-subtle bg-surface-primary text-accent-sky group-hover:scale-105 transition-transform">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>

                <p className="mt-3 text-sm font-semibold text-text-primary">
                  Drag and drop your image here, or <span className="text-accent-sky underline underline-offset-4">browse</span>
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Images will be processed and indexed with visual preview thumbnails.
                </p>
              </div>
            ) : (
              /* When 1 image is uploaded, show the single preview card (option to upload new is removed) */
              <div className="rounded-xl border border-border-subtle bg-surface-secondary/40 p-4 space-y-4">
                <div className="text-xs font-semibold text-text-secondary">
                  <span>Selected Image</span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border border-border-subtle bg-surface-primary p-3">
                  {/* Image Thumbnail */}
                  <div className="relative aspect-video w-full sm:w-48 bg-surface-secondary overflow-hidden rounded-lg shrink-0">
                    {stagedImage.previewUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={stagedImage.previewUrl}
                        alt={stagedImage.name}
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-text-muted text-xs font-mono">
                        Preview
                      </div>
                    )}
                  </div>

                  {/* Image Details */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-text-primary truncate" title={stagedImage.name}>
                      {stagedImage.name}
                    </p>
                    <p className="text-[10px] text-text-muted font-mono mt-0.5">
                      {stagedImage.size} • {stagedImage.dimensions}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">
                      Ready to index into multimodal knowledge base.
                    </p>
                  </div>
                </div>

                {/* Index Action Button */}
                <div className="pt-2 flex items-center justify-between border-t border-border-subtle">
                  <div className="text-xs text-text-muted font-mono">
                    {isImagesProcessing ? (
                      <span className="text-accent-sky animate-pulse">{imageProcessingStep}</span>
                    ) : (
                      <span>Ready to index image</span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isImagesProcessing}
                    onClick={handleIndexImageSubmit}
                    className="btn-primary h-9 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                  >
                    {isImagesProcessing && (
                      <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    )}
                    <span>{isImagesProcessing ? "Indexing..." : "Index Image"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* MODE 3: WRITE TEXT INTERFACE                                     */}
        {/* Feed The Data via reusable ChatInput component + Tags             */}
        {/* ================================================================ */}
        {activeInputMode === "text" && (
          <div className="mt-5 space-y-4 animate-fadeIn">
            {/* Tags selection section */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tagsList.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setSelectedTag(tag.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedTag === tag.id
                        ? "border border-accent-sky/50 bg-surface-secondary text-accent-sky shadow-sm"
                        : "border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-strong bg-surface-secondary/40"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {textError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 font-mono">
                ⚠ {textError}
              </div>
            )}

            {/* Reusable ChatInput component configuration */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Feed The Data
              </label>

              {/* Exact ChatInput component as in Ask interface */}
              <ChatInput
                value={textValue}
                onChange={(val) => {
                  const text = typeof val === "string" ? val : val?.target?.value ?? "";
                  setTextValue(text);
                  if (textError) setTextError("");
                }}
                onSubmit={handleTextSubmit}
                disabled={isTextSubmitting}
                isLoading={isTextSubmitting}
                placeholder="Write something you want Alaya to remember..."
                ariaLabel="Feed the data"
                submitButtonTitle="Save memory"
                submitButtonAriaLabel="Save memory to Knowledge Base"
                subtext="Recorded memories are immediately indexed and grounded for future conversations."
                showSubtext={true}
                className="px-0 pt-0 pb-0 bg-transparent"
                containerClassName="w-full"
              />
            </div>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* SECTION 2: EXISTING KNOWLEDGE ITEMS                                  */}
      {/* Horizontal divider placed ABOVE Existing Knowledge with proper spacing*/}
      {/* ==================================================================== */}
      <section className="border-t border-border-subtle pt-8 sm:pt-10 space-y-6">
        {/* Section Header */}
        <div>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">
            Existing Knowledge
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            All indexed knowledge available to Alaya in conversations.
          </p>
        </div>

        {/* Controls Toolbar: Filter Tabs & Enhanced Search Bar in unified alignment */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Knowledge", count: items.length },
              { id: "document", label: "Documents", count: docCount },
              { id: "image", label: "Images", count: imgCount },
              { id: "memory", label: "Written Text", count: memCount },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeFilter === tab.id
                    ? "border border-accent-sky/50 bg-surface-secondary text-accent-sky shadow-sm"
                    : "border border-border-subtle/50 text-text-muted hover:text-text-primary hover:bg-surface-secondary/50 hover:border-border-subtle"
                }`}
              >
                {tab.label} <span className="ml-1 opacity-70 font-mono text-[11px]">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative w-full sm:w-72 md:w-80">
            <div className="group relative flex items-center h-9 w-full rounded-xl border border-border-subtle bg-surface-primary hover:border-border-strong px-3 text-xs transition-all duration-200 focus-within:border-accent-sky focus-within:ring-1 focus-within:ring-accent-sky/30 focus-within:bg-surface-secondary/70">
              <svg
                className="h-4 w-4 shrink-0 text-text-muted group-focus-within:text-accent-sky transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search knowledge..."
                className="w-full bg-transparent px-2.5 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
              />

              {searchQuery ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono text-accent-sky hidden sm:inline">
                    {filteredItems.length} found
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="rounded p-0.5 text-text-muted hover:text-text-primary hover:bg-surface-tertiary transition-colors"
                    aria-label="Clear search"
                    title="Clear search (Esc)"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <kbd className="hidden sm:inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 rounded border border-border-subtle bg-surface-secondary text-[10px] font-mono text-text-muted select-none" title="Press / to search">
                  /
                </kbd>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingUploads && (
          <div className="rounded-xl border border-border-subtle bg-surface-primary/40 p-12 text-center flex flex-col items-center justify-center gap-3">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-accent-sky border-t-transparent"
              role="status"
              aria-label="Loading knowledge base..."
            />
            <p className="text-xs text-text-muted font-medium tracking-wide">
              Loading your Knowledge Base...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingUploads && filteredItems.length === 0 && (
          <div className="rounded-xl border border-border-subtle bg-surface-primary/40 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-text-primary">
              No knowledge items found
            </p>
            <p className="text-xs text-text-muted">
              {searchQuery
                ? `No items matched your search query "${searchQuery}".`
                : "No items recorded in this category yet. Upload a document, image, or note above to add knowledge to Alaya."}
            </p>
            {(searchQuery || activeFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="mt-3 text-xs text-accent-sky underline underline-offset-4 cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Knowledge Grid - Symmetrical Equal-Size Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filteredItems.map((item) => <KnowledgeCard key={item.id} item={item} onDelete={setItemToDelete} onOpen={setOpenedText} />)}
        </div>
      </section>

      {openedText && <KnowledgeTextModal item={openedText} onClose={() => setOpenedText(null)} />}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <DeleteKnowledgeItemModal
          item={itemToDelete}
          isDeleting={isDeletingItem}
          error={deleteError}
          onClose={() => {
            if (!isDeletingItem) setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
