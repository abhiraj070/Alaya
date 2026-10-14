"use client";

import { useState, useRef, useEffect } from "react";
import ChatInput from "@/components/app/ChatInput";
import { mockKnowledgeItems, mockImages } from "@/mock/knowledge";

// Format date in friendly human-readable format
function formatItemDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const year = d.getUTCFullYear();
    const month = months[d.getUTCMonth()];
    const day = d.getUTCDate();
    return `${month} ${day}, ${year}`;
  } catch {
    return dateStr;
  }
}

// Format byte count to human-readable string
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Document extension colors
function getExtBadgeStyle(ext) {
  const lower = (ext || "").toLowerCase();
  switch (lower) {
    case "pdf":
      return "border-rose-500/30 bg-rose-500/10 text-rose-400";
    case "docx":
    case "doc":
      return "border-sky-500/30 bg-sky-500/10 text-sky-400";
    case "xlsx":
    case "xls":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "pptx":
    case "ppt":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    case "txt":
    default:
      return "border-border-strong bg-surface-secondary text-text-secondary";
  }
}

// Memory category badge styles
function getCategoryBadgeStyle(cat) {
  const lower = (cat || "").toLowerCase();
  switch (lower) {
    case "accomplishment":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "decision":
      return "border-sky-500/30 bg-sky-500/10 text-accent-sky";
    case "idea":
      return "border-purple-500/30 bg-purple-500/10 text-purple-400";
    case "experience":
    case "event":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    case "learning":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-400";
    default:
      return "border-accent-sky/30 bg-accent-sky/10 text-accent-sky";
  }
}

let idCounter = 0;
function generateId(prefix = "kb") {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Date.now()}`;
}

export default function KnowledgeBaseManager() {
  // Knowledge Base items state (persisted locally in React state)
  const [items, setItems] = useState(mockKnowledgeItems);

  // Active input mode: "files" | "images" | "text"
  const [activeInputMode, setActiveInputMode] = useState("files");

  // Global notification toast
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = "success") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // ==========================================
  // MODE 1: UPLOAD FILES (Single Document)
  // Backend endpoint supports only 1 document at a time
  // ==========================================
  const [stagedFile, setStagedFile] = useState(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [isFilesProcessing, setIsFilesProcessing] = useState(false);
  const [fileProcessingStep, setFileProcessingStep] = useState("");
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);

  const allowedDocExtensions = ["pdf", "docx", "doc", "txt", "xlsx", "xls", "pptx", "ppt"];
  const imageExtensions = ["png", "jpg", "jpeg", "webp", "gif", "svg"];

  const handleFileSelected = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setFileError("");

    const file = fileList[0];
    const ext = file.name.split(".").pop().toLowerCase();

    if (imageExtensions.includes(ext) || file.type.startsWith("image/")) {
      setFileError('Image detected. Please switch to the "Upload Images" tab to upload images.');
      return;
    }

    if (!allowedDocExtensions.includes(ext)) {
      setFileError(`"${file.name}" is not a supported document format (PDF, DOCX, TXT, XLSX, PPTX).`);
      return;
    }

    setStagedFile({
      id: generateId("staged_doc"),
      name: file.name,
      size: formatBytes(file.size),
      rawSize: file.size,
      fileType: ext,
      fileObj: file,
    });
  };

  const handleIngestFileSubmit = () => {
    if (!stagedFile || isFilesProcessing) return;

    setIsFilesProcessing(true);
    setFileProcessingStep("Parsing document contents...");

    setTimeout(() => {
      setFileProcessingStep("Splitting into semantic chunks...");
    }, 450);

    setTimeout(() => {
      setFileProcessingStep("Generating vector embeddings...");
    }, 900);

    setTimeout(() => {
      const fileName = stagedFile.name;
      const newDoc = {
        id: generateId("kb_doc"),
        type: "document",
        title: stagedFile.name,
        fileType: stagedFile.fileType,
        fileSize: stagedFile.size,
        meta: `${Math.floor(Math.random() * 15) + 4} pages • ${Math.floor(Math.random() * 10) + 6} chunks`,
        createdAt: new Date().toISOString(),
        tags: ["#uploaded", `#${stagedFile.fileType}`, "#ingested"],
      };

      setItems((prev) => [newDoc, ...prev]);
      setStagedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsFilesProcessing(false);
      setFileProcessingStep("");
      showToast(`Successfully ingested "${fileName}" into your Knowledge Base.`);
    }, 1400);
  };

  // ==========================================
  // MODE 2: UPLOAD IMAGES (Single Image)
  // Backend endpoint supports only 1 image at a time
  // ==========================================
  const [stagedImage, setStagedImage] = useState(null);
  const [isImageDragging, setIsImageDragging] = useState(false);
  const [isImagesProcessing, setIsImagesProcessing] = useState(false);
  const [imageProcessingStep, setImageProcessingStep] = useState("");
  const [imageError, setImageError] = useState("");
  const imageInputRef = useRef(null);

  const allowedImageExts = ["png", "jpg", "jpeg", "webp"];

  const handleImageSelected = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setImageError("");

    const file = fileList[0];
    const ext = file.name.split(".").pop().toLowerCase();

    if (allowedDocExtensions.includes(ext) || file.type.includes("pdf")) {
      setImageError('Document detected. Please switch to the "Upload Files" tab to upload documents.');
      return;
    }

    if (!allowedImageExts.includes(ext) && !file.type.startsWith("image/")) {
      setImageError(`"${file.name}" is not a supported image format (PNG, JPG, JPEG, WebP).`);
      return;
    }

    // Generate local preview URL
    let previewUrl = "";
    try {
      previewUrl = URL.createObjectURL(file);
    } catch {
      previewUrl = "";
    }

    setStagedImage({
      id: generateId("staged_img"),
      name: file.name,
      size: formatBytes(file.size),
      rawSize: file.size,
      fileType: ext || "png",
      previewUrl: previewUrl,
      dimensions: "1920 × 1080",
      fileObj: file,
    });
  };

  const handleIndexImageSubmit = () => {
    if (!stagedImage || isImagesProcessing) return;

    setIsImagesProcessing(true);
    setImageProcessingStep("Analyzing image contents & visual layout...");

    setTimeout(() => {
      setImageProcessingStep("Extracting visual metadata...");
    }, 450);

    setTimeout(() => {
      setImageProcessingStep("Indexing into multimodal knowledge index...");
    }, 900);

    setTimeout(() => {
      const imageName = stagedImage.name;
      const newItem = {
        id: generateId("kb_img"),
        type: "image",
        title: stagedImage.name,
        fileType: stagedImage.fileType,
        fileSize: stagedImage.size,
        dimensions: stagedImage.dimensions || "1920 × 1080",
        previewUrl: stagedImage.previewUrl || (mockImages[0] ? mockImages[0].previewUrl : ""),
        createdAt: new Date().toISOString(),
        status: "Indexed",
        tags: ["#image", `#${stagedImage.fileType}`, "#multimodal"],
      };

      setItems((prev) => [newItem, ...prev]);
      setStagedImage(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      setIsImagesProcessing(false);
      setImageProcessingStep("");
      showToast(`Successfully indexed "${imageName}" into your Knowledge Base.`);
    }, 1400);
  };

  // ==========================================
  // MODE 3: WRITE TEXT (Feed The Data)
  // Reuses the exact same ChatInput component
  // ==========================================
  const [textValue, setTextValue] = useState("");
  const [isTextSubmitting, setIsTextSubmitting] = useState(false);
  const [textError, setTextError] = useState("");

  const handleTextSubmit = () => {
    const trimmed = textValue.trim();
    if (!trimmed) {
      setTextError("Please enter some knowledge or memory text before submitting.");
      return;
    }

    setIsTextSubmitting(true);
    setTextError("");

    // Simulate brief local processing
    setTimeout(() => {
      // Derive a natural title from first 6-7 words
      const words = trimmed.split(/\s+/);
      const snippet = words.slice(0, 6).join(" ");
      const autoTitle = words.length > 6 ? `${snippet}...` : snippet;

      const newMemory = {
        id: generateId("kb_mem"),
        type: "memory",
        title: autoTitle,
        content: trimmed,
        category: "Memory",
        createdAt: new Date().toISOString(),
        status: "Grounded",
        tags: ["#memory", "#grounded", "#personal"],
      };

      setItems((prev) => [newMemory, ...prev]);
      setTextValue("");
      setIsTextSubmitting(false);
      showToast(`Memory recorded: "${autoTitle}" is now grounded in your Knowledge Base.`);
    }, 250);
  };

  // ==========================================
  // EXISTING KNOWLEDGE: FILTERING & SEARCH
  // ==========================================
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "document" | "image" | "memory"
  const [searchQuery, setSearchQuery] = useState("");

  const docCount = items.filter((i) => i.type === "document").length;
  const imgCount = items.filter((i) => i.type === "image").length;
  const memCount = items.filter((i) => i.type === "memory").length;

  const filteredItems = items.filter((item) => {
    if (activeFilter !== "all" && item.type !== activeFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const titleMatch = (item.title || "").toLowerCase().includes(query);
    const contentMatch = (item.content || "").toLowerCase().includes(query);
    const tagMatch = (item.tags || []).some((t) => t.toLowerCase().includes(query));
    const metaMatch = (item.meta || "").toLowerCase().includes(query);
    return titleMatch || contentMatch || tagMatch || metaMatch;
  });

  const handleDeleteItem = (id, title) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast(`Removed "${title || "Item"}" from Knowledge Base.`, "info");
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Header */}
      <div className="border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Feed information to Alaya through files, images, or natural-language memories. Everything is unified into your personal knowledge index.
          </p>
        </div>
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
                  accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.pptx,.ppt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/vnd.openxmlformats-officedocument.presentationml.presentation"
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
                <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                  <span>Selected Document</span>
                  {!isFilesProcessing && (
                    <button
                      type="button"
                      onClick={() => {
                        setStagedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-text-muted hover:text-rose-400 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between py-2 gap-3">
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

                  {!isFilesProcessing && (
                    <button
                      type="button"
                      onClick={() => {
                        setStagedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-text-muted hover:text-rose-400 p-1 transition-colors"
                      title="Remove file"
                      aria-label={`Remove ${stagedFile.name}`}
                    >
                      ✕
                    </button>
                  )}
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
              <span className="font-mono">Max 15 MB</span>
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
                <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                  <span>Selected Image</span>
                  {!isImagesProcessing && (
                    <button
                      type="button"
                      onClick={() => {
                        setStagedImage(null);
                        if (imageInputRef.current) imageInputRef.current.value = "";
                      }}
                      className="text-text-muted hover:text-rose-400 transition-colors"
                    >
                      Remove
                    </button>
                  )}
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

                  {!isImagesProcessing && (
                    <button
                      type="button"
                      onClick={() => {
                        setStagedImage(null);
                        if (imageInputRef.current) imageInputRef.current.value = "";
                      }}
                      className="text-text-muted hover:text-rose-400 p-1.5 transition-colors self-start sm:self-center"
                      title="Remove image"
                      aria-label={`Remove ${stagedImage.name}`}
                    >
                      ✕
                    </button>
                  )}
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
        {/* Feed The Data via reusable ChatInput component                    */}
        {/* ================================================================ */}
        {activeInputMode === "text" && (
          <div className="mt-5 space-y-4 animate-fadeIn">
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
                onChange={(e) => {
                  setTextValue(e.target.value);
                  if (textError) setTextError("");
                }}
                onSubmit={handleTextSubmit}
                disabled={isTextSubmitting}
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
      {/* Represent documents, images, and written entries appropriately       */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        {/* Section Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-text-primary">
              Existing Knowledge
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              All indexed knowledge available to Alaya in conversations.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge..."
              className="w-full rounded-lg border border-border-subtle bg-surface-primary px-3 py-1.5 pl-8 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-sky focus:outline-none"
            />
            <svg
              className="absolute left-2.5 top-2 h-3.5 w-3.5 text-text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1.5 text-text-muted hover:text-text-primary text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
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
                  : "border border-transparent text-text-muted hover:text-text-primary hover:bg-surface-secondary/40"
              }`}
            >
              {tab.label} <span className="ml-1 opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="rounded-xl border border-border-subtle bg-surface-primary/40 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-text-primary">
              No knowledge items found
            </p>
            <p className="text-xs text-text-muted">
              {searchQuery
                ? `No items matched your search query "${searchQuery}".`
                : "No items recorded in this category yet."}
            </p>
            {(searchQuery || activeFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="mt-3 text-xs text-accent-sky underline underline-offset-4"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Knowledge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            // ==========================================
            // 1. DOCUMENT ITEM CARD
            // ==========================================
            if (item.type === "document") {
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border-subtle bg-surface-primary p-4 sm:p-5 hover:border-accent-sky/30 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Type Badge & Date */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase border ${getExtBadgeStyle(
                          item.fileType
                        )}`}
                      >
                        Document · {item.fileType}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-text-muted" suppressHydrationWarning>
                          {formatItemDate(item.createdAt)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.title)}
                          className="text-text-muted hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete item"
                          aria-label={`Delete ${item.title}`}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Content Display */}
                    <div className="mt-3 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface-secondary text-xs font-bold uppercase text-accent-sky font-mono">
                        {item.fileType}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-text-primary truncate" title={item.title}>
                          {item.title}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          {item.fileSize} • {item.meta}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Tags & Status */}
                  <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-[10px] font-mono">
                    <div className="flex flex-wrap gap-1.5">
                      {(item.tags || []).slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-surface-secondary px-1.5 py-0.5 text-text-muted border border-border-subtle"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Indexed
                    </span>
                  </div>
                </div>
              );
            }

            // ==========================================
            // 2. IMAGE ITEM CARD
            // ==========================================
            if (item.type === "image") {
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border-subtle bg-surface-primary p-4 sm:p-5 hover:border-accent-sky/30 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Type Badge & Date */}
                    <div className="flex items-center justify-between">
                      <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                        Image · {item.fileType}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-text-muted" suppressHydrationWarning>
                          {formatItemDate(item.createdAt)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.title)}
                          className="text-text-muted hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete item"
                          aria-label={`Delete ${item.title}`}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Image Preview Thumbnail */}
                    <div className="mt-3 overflow-hidden rounded-lg border border-border-subtle bg-surface-secondary aspect-video relative">
                      {item.previewUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.previewUrl}
                          alt={item.title}
                          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-text-muted text-xs font-mono">
                          Image
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="mt-2.5">
                      <h3 className="text-sm font-semibold text-text-primary truncate" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5 font-mono">
                        {item.dimensions || "1920 × 1080"} • {item.fileSize}
                      </p>
                    </div>
                  </div>

                  {/* Footer Tags & Status */}
                  <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-[10px] font-mono">
                    <div className="flex flex-wrap gap-1.5">
                      {(item.tags || []).slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-surface-secondary px-1.5 py-0.5 text-text-muted border border-border-subtle"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Indexed
                    </span>
                  </div>
                </div>
              );
            }

            // ==========================================
            // 3. WRITTEN MEMORY CARD (Natural Language)
            // ==========================================
            return (
              <div
                key={item.id}
                className="rounded-xl border border-border-strong bg-surface-secondary/80 p-4 sm:p-5 hover:border-accent-sky/50 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  {/* Header: Category Badge & Date */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase border ${getCategoryBadgeStyle(
                        item.category
                      )}`}
                    >
                      {item.category || "Memory"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-text-muted" suppressHydrationWarning>
                        {formatItemDate(item.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        className="text-text-muted hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete item"
                        aria-label={`Delete ${item.title}`}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Quoted Content Presentation */}
                  <div className="mt-3 border-l-2 border-accent-sky/60 pl-3">
                    <h3 className="text-xs font-semibold text-accent-sky font-mono">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-text-primary leading-relaxed italic">
                      &ldquo;{item.content}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Footer Tags & Status */}
                <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-[10px] font-mono">
                  <div className="flex flex-wrap gap-1.5">
                    {(item.tags || []).slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-surface-primary px-1.5 py-0.5 text-text-muted border border-border-subtle"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-accent-sky font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-sky" />
                    Grounded
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
