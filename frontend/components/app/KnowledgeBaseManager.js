"use client";

import { useState } from "react";
import { mockKnowledgeItems } from "@/mock/knowledge";

export default function KnowledgeBaseManager() {
  const [items, setItems] = useState(mockKnowledgeItems);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "document" | "memory"
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form states for Add Knowledge (Natural Language)
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryContent, setMemoryContent] = useState("");
  const [memoryCategory, setMemoryCategory] = useState("Milestone");
  const [formError, setFormError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const filteredItems = items.filter((item) => {
    if (activeFilter === "all") return true;
    return item.type === activeFilter;
  });

  const handleAddMemorySubmit = (e) => {
    e.preventDefault();
    if (!memoryContent.trim()) {
      setFormError("Please enter the knowledge you want Alaya to remember.");
      return;
    }

    const newMemory = {
      id: `kb_mem_${Date.now()}`,
      type: "memory",
      title: memoryTitle.trim() || "Quick Note",
      content: memoryContent.trim(),
      category: memoryCategory,
      createdAt: new Date().toISOString(),
      tags: ["#new", `#${memoryCategory.toLowerCase()}`],
    };

    setItems([newMemory, ...items]);
    setMemoryTitle("");
    setMemoryContent("");
    setFormError("");
    setIsAddModalOpen(false);
    setSuccessToast("Knowledge entry added successfully!");
    setTimeout(() => setSuccessToast(""), 3500);
  };

  const handleUploadDocSimulated = (fileName, fileType) => {
    const newDoc = {
      id: `kb_doc_${Date.now()}`,
      type: "document",
      title: fileName,
      fileType: fileType,
      fileSize: "1.8 MB",
      meta: "10 pages • 8 chunks",
      createdAt: new Date().toISOString(),
      tags: ["#uploaded", `#${fileType}`],
    };

    setItems([newDoc, ...items]);
    setIsUploadModalOpen(false);
    setSuccessToast(`Document "${fileName}" ingested successfully!`);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your uploaded documents and natural-language memories in one unified index.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="btn-secondary h-10 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
          >
            <svg className="h-4 w-4 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Upload Document</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary h-10 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.25)]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span>Add Knowledge</span>
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400 font-mono animate-fadeIn">
          <span>✓ {successToast}</span>
          <button
            type="button"
            onClick={() => setSuccessToast("")}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs & Stats Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: "all", label: "All Knowledge", count: items.length },
            { id: "document", label: "Documents", count: items.filter((i) => i.type === "document").length },
            { id: "memory", label: "Memories", count: items.filter((i) => i.type === "memory").length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                activeFilter === tab.id
                  ? "border border-accent-sky/50 bg-surface-secondary text-accent-sky shadow-sm"
                  : "border border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              {tab.label} <span className="ml-1 opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="text-xs text-text-muted font-mono">
          UNIFIED VECTOR SPACE • 1,536-D
        </div>
      </div>

      {/* Knowledge Items Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-5 transition-all ${
              item.type === "document"
                ? "border-border-subtle bg-surface-primary/70 hover:border-accent-sky/30"
                : "border-border-strong bg-surface-secondary/80 hover:border-accent-sky/50 shadow-sm"
            }`}
          >
            {/* Card Header: Type Badge & Timestamp */}
            <div className="flex items-center justify-between">
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase border ${
                  item.type === "document"
                    ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                    : "border-purple-500/30 bg-purple-500/10 text-purple-400"
                }`}
              >
                {item.type === "document" ? "Document" : "Memory"}
              </span>

              <span className="text-[10px] font-mono text-text-muted">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Content Display: Distinct treatment for Document vs Memory */}
            {item.type === "document" ? (
              /* Document Representation */
              <div className="mt-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface-secondary text-xs font-bold uppercase text-accent-sky font-mono">
                    {item.fileType}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-text-primary truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {item.fileSize} • {item.meta}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Memory Representation (Note / Quote representation) */
              <div className="mt-3">
                <div className="border-l-2 border-accent-sky/50 pl-3">
                  <h3 className="text-xs font-semibold text-accent-sky font-mono">
                    {item.title} ({item.category})
                  </h3>
                  <p className="mt-1 text-xs text-text-primary leading-relaxed italic">
                    "{item.content}"
                  </p>
                </div>
              </div>
            )}

            {/* Footer Tags */}
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border-subtle pt-3">
              {item.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="rounded bg-surface-primary px-1.5 py-0.5 text-[9px] font-mono text-text-muted border border-border-subtle"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Knowledge (Natural-Language Form) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border-strong bg-surface-primary p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Add Natural-Language Knowledge
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Save facts, events, or preferences directly to your Knowledge Base.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setFormError("");
                }}
                className="text-text-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemorySubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Title / Subject (Optional)
                </label>
                <input
                  type="text"
                  value={memoryTitle}
                  onChange={(e) => setMemoryTitle(e.target.value)}
                  placeholder="e.g. Architecture Decisions, Meeting Summary"
                  className="input-field w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Category
                </label>
                <select
                  value={memoryCategory}
                  onChange={(e) => setMemoryCategory(e.target.value)}
                  className="input-field w-full text-xs bg-surface-primary"
                >
                  <option value="Milestone">Milestone / Accomplishment</option>
                  <option value="Decision">Decision / Architecture</option>
                  <option value="Preference">Preference / Habit</option>
                  <option value="Fact">Fact / Information</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Knowledge Content <span className="text-accent-sky">*</span>
                </label>
                <textarea
                  rows={4}
                  value={memoryContent}
                  onChange={(e) => {
                    setMemoryContent(e.target.value);
                    if (formError) setFormError("");
                  }}
                  placeholder="e.g. I discussed the new project architecture with my team. We decided to use Redis for background jobs."
                  className="w-full rounded-lg border border-border-subtle bg-surface-secondary p-3 text-xs text-text-primary focus:border-accent-sky focus:outline-none focus:ring-1 focus:ring-accent-sky"
                />
              </div>

              {/* Error State */}
              {formError && (
                <p className="text-xs text-rose-400 font-mono">
                  ⚠ {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setFormError("");
                  }}
                  className="btn-ghost h-9 px-4 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary h-9 px-5 text-xs font-semibold uppercase tracking-wider shadow-sm"
                >
                  Save Knowledge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Document Simulation */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border-strong bg-surface-primary p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Upload Documents
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Supported formats: PDF, DOCX, XLSX, TXT, PPTX & Images.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-text-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-accent-sky/40 bg-surface-secondary/40 p-6 text-center">
                <svg className="h-8 w-8 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="mt-2 text-xs font-semibold text-text-primary">
                  Simulate Document Upload
                </p>
                <p className="text-[11px] text-text-muted mt-1">
                  Click a sample document to test ingestion:
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUploadDocSimulated("Product_Specs_v2.pdf", "pdf")}
                    className="rounded bg-surface-primary px-2.5 py-1 text-xs text-accent-sky border border-border-subtle hover:border-accent-sky"
                  >
                    + Product_Specs_v2.pdf
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUploadDocSimulated("Sprint_Tasks.docx", "docx")}
                    className="rounded bg-surface-primary px-2.5 py-1 text-xs text-accent-sky border border-border-subtle hover:border-accent-sky"
                  >
                    + Sprint_Tasks.docx
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUploadDocSimulated("Budget_Forecast.xlsx", "xlsx")}
                    className="rounded bg-surface-primary px-2.5 py-1 text-xs text-accent-sky border border-border-subtle hover:border-accent-sky"
                  >
                    + Budget_Forecast.xlsx
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="btn-ghost h-9 px-4 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
