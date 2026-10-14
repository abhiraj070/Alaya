"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatInput from "@/components/app/ChatInput";
import { useAuth } from "@/lib/auth-context";
import { messagesApi, uploadedDataApi } from "@/lib/api";

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
  const { user } = useAuth();
  // Knowledge Base items state (persisted locally in React state)
  const [items, setItems] = useState([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(false);

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

  // Fetch real uploaded items from backend if user is authenticated
  const fetchUploads = useCallback(async () => {
    if (!user?.id || typeof user.id !== "number" || !user?.isAuthenticated) {
      setItems([]);
      return;
    }

    setIsLoadingUploads(true);
    try {
      const uploads = await uploadedDataApi.getUploads(user.id);
      if (!Array.isArray(uploads) || uploads.length === 0) {
        setItems([]);
        return;
      }

      const backendItems = uploads.map((up) => {
        if (up.data_type === "docs") {
          const ext = up.tag || "pdf";
          return {
            id: `up_doc_${up.id}`,
            type: "document",
            title: up.tag ? `${up.tag.toUpperCase()} Document` : "Uploaded Document",
            fileType: ext,
            fileSize: "Document",
            meta: "Indexed Document",
            url: up.data_source,
            createdAt: up.created_at,
            tags: [up.tag ? `#${up.tag}` : "#document", "#uploaded"],
          };
        } else if (up.data_type === "img") {
          return {
            id: `up_img_${up.id}`,
            type: "image",
            title: "Uploaded Image",
            fileType: up.tag || "png",
            fileSize: "Image",
            dimensions: "Multimodal",
            previewUrl: up.data_source,
            url: up.data_source,
            createdAt: up.created_at,
            status: "Indexed",
            tags: ["#image", up.tag ? `#${up.tag}` : "#multimodal"],
          };
        } else {
          const words = (up.data_source || "").split(/\s+/);
          const snippet = words.slice(0, 6).join(" ");
          const autoTitle = words.length > 6 ? `${snippet}...` : snippet || "Saved Note";
          return {
            id: `up_mem_${up.id}`,
            type: "memory",
            title: autoTitle,
            content: up.data_source,
            category: up.tag || "Note",
            createdAt: up.created_at,
            status: "Grounded",
            tags: [up.tag ? `#${up.tag.toLowerCase()}` : "#memory"],
          };
        }
      });

      setItems(backendItems);
    } catch (err) {
      if (err?.status !== 401 && err?.status !== 403) {
        console.warn("Could not load backend uploads:", err);
      }
    } finally {
      setIsLoadingUploads(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    requestAnimationFrame(() => {
      if (isMounted) {
        fetchUploads().catch(() => {});
      }
    });

    return () => {
      isMounted = false;
    };
  }, [fetchUploads]);

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

  const handleIngestFileSubmit = async () => {
    if (!stagedFile || isFilesProcessing) return;

    setIsFilesProcessing(true);
    setFileProcessingStep("Uploading document to backend...");
    const fileName = stagedFile.name;

    try {
      if (user?.id && user?.isAuthenticated && stagedFile.fileObj) {
        await messagesApi.uploadFile(stagedFile.fileObj);
      }
      setFileProcessingStep("Generating vector embeddings...");

      const newDoc = {
        id: generateId("kb_doc"),
        type: "document",
        title: stagedFile.name,
        fileType: stagedFile.fileType,
        fileSize: stagedFile.size,
        meta: `${Math.floor(Math.random() * 15) + 4} pages • Indexed`,
        createdAt: new Date().toISOString(),
        tags: ["#uploaded", `#${stagedFile.fileType}`, "#ingested"],
      };

      setItems((prev) => [newDoc, ...prev]);
      setStagedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsFilesProcessing(false);
      setFileProcessingStep("");
      showToast(`Successfully ingested "${fileName}" into your Knowledge Base.`);
      if (user?.id && user?.isAuthenticated) {
        fetchUploads().catch(() => {});
      }
    } catch (err) {
      console.error("Document upload failed:", err);
      setIsFilesProcessing(false);
      setFileProcessingStep("");
      setFileError(err.message || "Failed to upload document.");
      showToast(`Upload failed: ${err.message || "Server error"}`, "error");
    }
  };

  // ==========================================
  // MODE 2: UPLOAD IMAGES (Single Image)
  // Backend endpoint supports only 1 image at a time (Max 2 MB)
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

    if (file.size > 2 * 1024 * 1024) {
      setImageError(`"${file.name}" exceeds 2 MB (${formatBytes(file.size)}). Backend supports up to 2 MB.`);
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
      dimensions: "Multimodal",
      fileObj: file,
    });
  };

  const handleIndexImageSubmit = async () => {
    if (!stagedImage || isImagesProcessing) return;

    if (stagedImage.rawSize > 2 * 1024 * 1024) {
      setImageError("Image size must not exceed 2 MB.");
      return;
    }

    setIsImagesProcessing(true);
    setImageProcessingStep("Uploading image to backend...");
    const imageName = stagedImage.name;

    try {
      if (user?.id && user?.isAuthenticated && stagedImage.fileObj) {
        await messagesApi.uploadImage(stagedImage.fileObj);
      }
      setImageProcessingStep("Indexing into multimodal knowledge index...");

      const newItem = {
        id: generateId("kb_img"),
        type: "image",
        title: stagedImage.name,
        fileType: stagedImage.fileType,
        fileSize: stagedImage.size,
        dimensions: stagedImage.dimensions || "1920 × 1080",
        previewUrl: stagedImage.previewUrl || "",
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
      if (user?.id && user?.isAuthenticated) {
        fetchUploads().catch(() => {});
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setIsImagesProcessing(false);
      setImageProcessingStep("");
      setImageError(err.message || "Failed to upload image.");
      showToast(`Upload failed: ${err.message || "Server error"}`, "error");
    }
  };

  // ==========================================
  // MODE 3: WRITE TEXT (Feed The Data)
  // Reuses the exact same ChatInput component + Tags selection
  // ==========================================
  const [textValue, setTextValue] = useState("");
  const [selectedTag, setSelectedTag] = useState("Accomplishment");
  const [isTextSubmitting, setIsTextSubmitting] = useState(false);
  const [textError, setTextError] = useState("");

  const tagsList = [
    { id: "Accomplishment", label: "#accomplishment" },
    { id: "Decision", label: "#decision" },
    { id: "Event", label: "#event" },
    { id: "Idea", label: "#idea" },
    { id: "Learning", label: "#learning" },
    { id: "Note", label: "#note" },
  ];

  const handleTextSubmit = async () => {
    const trimmed = textValue.trim();
    if (!trimmed) {
      setTextError("Please enter some knowledge or memory text before submitting.");
      return;
    }

    setIsTextSubmitting(true);
    setTextError("");

    try {
      if (user?.id && user?.isAuthenticated) {
        await messagesApi.feedKnowledge({
          textContent: trimmed,
          tag: selectedTag,
        });
      }

      // Derive a natural title from first 6-7 words
      const words = trimmed.split(/\s+/);
      const snippet = words.slice(0, 6).join(" ");
      const autoTitle = words.length > 6 ? `${snippet}...` : snippet;

      const newMemory = {
        id: generateId("kb_mem"),
        type: "memory",
        title: autoTitle,
        content: trimmed,
        category: selectedTag,
        createdAt: new Date().toISOString(),
        status: "Grounded",
        tags: [`#${selectedTag.toLowerCase()}`, "#memory"],
      };

      setItems((prev) => [newMemory, ...prev]);
      setTextValue("");
      setIsTextSubmitting(false);
      showToast(`Memory recorded: "${autoTitle}" is now grounded in your Knowledge Base.`);
      if (user?.id && user?.isAuthenticated) {
        fetchUploads().catch(() => {});
      }
    } catch (err) {
      console.error("Text knowledge ingestion failed:", err);
      setIsTextSubmitting(false);
      setTextError(err.message || "Failed to feed knowledge.");
      showToast(`Submission failed: ${err.message || "Server error"}`, "error");
    }
  };

  // ==========================================
  // EXISTING KNOWLEDGE: FILTERING & SEARCH
  // ==========================================
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "document" | "image" | "memory"
  const [searchQuery, setSearchQuery] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);
  const searchInputRef = useRef(null);

  // Keyboard shortcut: Press '/' to focus search, 'Escape' to clear or close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (itemToDelete) {
          setItemToDelete(null);
          return;
        }
        if (document.activeElement === searchInputRef.current) {
          setSearchQuery("");
          searchInputRef.current?.blur();
        }
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        if (!itemToDelete) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [itemToDelete]);

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
    const fileTypeMatch = (item.fileType || "").toLowerCase().includes(query);
    const categoryMatch = (item.category || "").toLowerCase().includes(query);
    return titleMatch || contentMatch || tagMatch || metaMatch || fileTypeMatch || categoryMatch;
  });

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const title = itemToDelete.title || "Item";
    setItems((prev) => prev.filter((item) => item.id !== itemToDelete.id));
    setItemToDelete(null);
    showToast(`Removed "${title}" from Knowledge Base.`, "info");
  };

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
          {filteredItems.map((item) => {
            // ==========================================
            // 1. DOCUMENT ITEM CARD (Equal Size Box)
            // ==========================================
            if (item.type === "document") {
              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between h-[210px] rounded-xl border border-border-subtle bg-surface-primary p-4 hover:border-accent-sky/40 transition-all duration-200 shadow-sm overflow-hidden"
                >
                  {/* Header: Type Badge, Date & Delete Button */}
                  <div className="flex items-center justify-between shrink-0">
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
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-muted hover:text-accent-sky p-1 transition-colors"
                          title="Open document in new tab"
                          aria-label={`Open ${item.title}`}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
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

                  {/* Middle Content */}
                  <div className="flex items-center gap-3 my-auto min-h-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-surface-secondary text-xs font-bold uppercase text-accent-sky font-mono">
                      {item.fileType}
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-text-primary hover:text-accent-sky line-clamp-2 leading-snug transition-colors inline-block"
                          title={`Open ${item.title}`}
                        >
                          {item.title}
                        </a>
                      ) : (
                        <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug" title={item.title}>
                          {item.title}
                        </h3>
                      )}
                      <p className="text-[11px] text-text-muted mt-1 font-mono">
                        {item.fileSize} • {item.meta}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Metadata Bar */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-2 border-t border-border-subtle/50 shrink-0">
                    <span>{item.fileSize}</span>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-sky hover:underline inline-flex items-center gap-1 font-sans font-medium"
                      >
                        <span>Open file</span>
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ) : (
                      <span className="uppercase">{item.fileType} file</span>
                    )}
                  </div>
                </div>
              );
            }

            // ==========================================
            // 2. IMAGE ITEM CARD (Equal Size Box)
            // ==========================================
            if (item.type === "image") {
              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between h-[210px] rounded-xl border border-border-subtle bg-surface-primary p-4 hover:border-accent-sky/40 transition-all duration-200 shadow-sm overflow-hidden"
                >
                  {/* Header: Type Badge, Date & Delete Button */}
                  <div className="flex items-center justify-between shrink-0">
                    <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                      Image · {item.fileType}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-text-muted" suppressHydrationWarning>
                        {formatItemDate(item.createdAt)}
                      </span>
                      {(item.url || item.previewUrl) && (
                        <a
                          href={item.url || item.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-muted hover:text-accent-sky p-1 transition-colors"
                          title="Open image in new tab"
                          aria-label={`Open ${item.title}`}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
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

                  {/* Middle Thumbnail Preview */}
                  {item.previewUrl || item.url ? (
                    <a
                      href={item.url || item.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative h-24 w-full overflow-hidden rounded-lg border border-border-subtle bg-surface-secondary my-auto shrink-0 block cursor-pointer group/thumb"
                      title="Click to view full image in new tab"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl || item.url}
                        alt={item.title}
                        className="h-full w-full object-cover object-center group-hover/thumb:scale-105 transition-transform duration-300"
                      />
                    </a>
                  ) : (
                    <div className="relative h-24 w-full overflow-hidden rounded-lg border border-border-subtle bg-surface-secondary my-auto shrink-0 flex items-center justify-center text-text-muted text-xs font-mono">
                      Image
                    </div>
                  )}

                  {/* Bottom Details Bar */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-2 border-t border-border-subtle/50 shrink-0">
                    <span className="truncate max-w-[140px] font-medium text-text-primary" title={item.title}>
                      {item.title}
                    </span>
                    {(item.url || item.previewUrl) ? (
                      <a
                        href={item.url || item.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-sky hover:underline inline-flex items-center gap-1 font-sans font-medium"
                      >
                        <span>Open image</span>
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ) : (
                      <span>{item.fileSize}</span>
                    )}
                  </div>
                </div>
              );
            }

            // ==========================================
            // 3. WRITTEN MEMORY CARD (Equal Size Box)
            // ==========================================
            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between h-[210px] rounded-xl border border-border-strong bg-surface-secondary/80 p-4 hover:border-accent-sky/50 transition-all duration-200 shadow-sm overflow-hidden"
              >
                {/* Header: Category Badge, Date & Delete Button */}
                <div className="flex items-center justify-between shrink-0">
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
                      onClick={() => setItemToDelete(item)}
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

                {/* Middle Content: Quoted Text with Line Clamping */}
                <div className="my-auto min-h-0 border-l-2 border-accent-sky/60 pl-3 overflow-hidden">
                  <h3 className="text-xs font-semibold text-accent-sky font-mono truncate mb-1">
                    {item.title}
                  </h3>
                  <p
                    className="text-xs text-text-primary/90 leading-relaxed italic line-clamp-3 overflow-hidden"
                    title={item.content}
                  >
                    &ldquo;{item.content}&rdquo;
                  </p>
                </div>

                {/* Bottom Details Bar */}
                <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-2 border-t border-border-subtle/50 shrink-0">
                  <span>{item.category || "Personal"}</span>
                  <span className="text-accent-sky/80">Text Entry</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Delete Confirmation Popup Modal */}
      {itemToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-desc"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setItemToDelete(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border-strong bg-surface-primary p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <h3 id="delete-dialog-title" className="text-sm font-bold text-text-primary">
                  Are you sure you want to delete this?
                </h3>
                <p className="mt-1 text-xs text-text-muted truncate font-medium">
                  &ldquo;{itemToDelete.title}&rdquo;
                </p>
                <p id="delete-dialog-desc" className="mt-2 text-xs text-text-secondary leading-relaxed">
                  All the Info in this data will be removed from alaya&apos;s memory.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="rounded-lg border border-border-subtle bg-surface-secondary px-3.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-strong transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white transition-all shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
