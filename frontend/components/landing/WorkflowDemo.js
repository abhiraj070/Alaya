"use client";

import { useState } from "react";
import AlayaWordmark from "@/components/ui/AlayaWordmark";

const DEFAULT_MEMORY_TEXT =
  "I had an interesting discussion with Rahul about using Redis for background jobs. We decided to use ARQ with FastAPI.";

export default function WorkflowDemo() {
  const [inputMode, setInputMode] = useState("write"); // "upload" | "write"
  const [selectedDocId, setSelectedDocId] = useState("doc-1");
  const [memoryInput, setMemoryInput] = useState(DEFAULT_MEMORY_TEXT);
  const [isMemorySaved, setIsMemorySaved] = useState(true);
  const [saveToast, setSaveToast] = useState("");

  const handleSaveMemory = () => {
    if (!memoryInput.trim()) return;
    setIsMemorySaved(true);
    setSaveToast("Memory saved to Knowledge Base!");
    setTimeout(() => setSaveToast(""), 3000);
  };

  return (
    <div className="relative mt-8 w-full rounded-2xl border border-border-strong bg-surface-primary/80 p-5 sm:p-7 backdrop-blur-md shadow-2xl">
      {/* Top Header: Selectable Input Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-sky opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-sky" />
          </span>
          <span className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider">
            INTERACTIVE WORKFLOW PREVIEW
          </span>
        </div>

        {/* Dual Input Mode Tabs */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-secondary p-1">
          <button
            type="button"
            onClick={() => setInputMode("upload")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
              inputMode === "upload"
                ? "bg-surface-primary text-accent-sky shadow-sm border border-border-strong"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Upload Documents</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode("write")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all ${
              inputMode === "write"
                ? "bg-surface-primary text-accent-sky shadow-sm border border-border-strong"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span>Write Memory</span>
          </button>
        </div>
      </div>

      {/* Main Dual Demonstration Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Input Interface according to selected mode (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-secondary/70 p-4 min-h-[300px]">
          {inputMode === "upload" ? (
            /* Mode A: Upload Documents */
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span className="text-xs font-semibold text-text-primary">Uploaded Documents</span>
                  <span className="text-[10px] font-mono text-accent-sky">MOCK SELECTOR</span>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  {[
                    { id: "doc-1", name: "Research Paper.pdf", type: "PDF", meta: "18 pages • pgvector analysis" },
                    { id: "doc-2", name: "Project Architecture.docx", type: "DOCX", meta: "12 sections • Redis queue" },
                    { id: "doc-3", name: "Financial Report Q3.xlsx", type: "XLSX", meta: "4 sheets • EBITDA metrics" },
                  ].map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`flex items-center gap-2.5 rounded-lg border p-2 text-left transition-all ${
                        selectedDocId === doc.id
                          ? "border-accent-sky bg-surface-primary shadow-sm"
                          : "border-border-subtle bg-surface-primary/60 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border-strong text-[9px] font-mono text-accent-sky">
                        {doc.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-text-primary">{doc.name}</p>
                        <p className="text-[10px] text-text-muted">{doc.meta}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded border border-dashed border-border-subtle bg-surface-primary/40 p-2 text-center text-[10px] text-text-muted font-mono">
                Supports PDF, DOCX, XLSX, TXT, PPTX & Images
              </div>
            </div>
          ) : (
            /* Mode B: Write Knowledge / Memories */
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span className="text-xs font-semibold text-text-primary">Record Personal Memory</span>
                  <span className="text-[10px] font-mono text-accent-sky">NATURAL LANGUAGE</span>
                </div>

                <div className="mt-3">
                  <label htmlFor="memory-input-demo" className="block text-[11px] text-text-muted mb-1 font-mono">
                    Tell Alaya what happened, a decision made, or something to remember:
                  </label>
                  <textarea
                    id="memory-input-demo"
                    rows={4}
                    value={memoryInput}
                    onChange={(e) => {
                      setMemoryInput(e.target.value);
                      setIsMemorySaved(false);
                    }}
                    className="w-full rounded-lg border border-border-strong bg-surface-primary p-2.5 text-xs text-text-primary focus:border-accent-sky focus:outline-none focus:ring-1 focus:ring-accent-sky"
                    placeholder="e.g. I had an interesting discussion with Rahul about using Redis for background jobs. We decided to use ARQ with FastAPI."
                  />
                </div>

                {/* Save Feedback Toast / Status */}
                {saveToast ? (
                  <div className="mt-2 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
                    <span>✓</span> {saveToast}
                  </div>
                ) : isMemorySaved ? (
                  <div className="mt-2 text-[11px] font-mono text-accent-sky flex items-center gap-1.5">
                    <span>•</span> Stored in your Knowledge Base
                  </div>
                ) : null}
              </div>

              {/* Action Button */}
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSaveMemory}
                  className="btn-primary h-8 px-4 text-xs font-semibold uppercase tracking-wider shadow-sm"
                >
                  Save Memory
                </button>
                <span className="text-[10px] font-mono text-text-muted">Type: Memory</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Conversational Chat Answering Based on Knowledge (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-border-strong bg-surface-secondary/80 p-4 min-h-[300px]">
          <div>
            <div className="flex items-center justify-between border-b border-border-subtle pb-2 text-[11px] font-mono text-text-muted">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent-sky" />
                <span className="font-semibold text-text-primary">Chat Retrieval Preview</span>
              </div>
              <span className="text-accent-sky">
                {inputMode === "upload" ? "SOURCE: DOCUMENT" : "SOURCE: MEMORY"}
              </span>
            </div>

            {/* Conversation Flow */}
            <div className="mt-4 space-y-3">
              {/* User Question */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-surface-tertiary px-3.5 py-2 text-xs text-text-primary border border-border-strong">
                  {inputMode === "upload"
                    ? "What did the research paper find regarding system latency?"
                    : "What did I discuss with Rahul about Redis?"}
                </div>
              </div>

              {/* Alaya Synthesized Answer */}
              <div className="flex justify-start">
                <div className="max-w-[95%] rounded-xl rounded-tl-sm bg-surface-primary border border-accent-sky/30 p-3.5 text-xs shadow-md">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono mb-1.5">
                    <AlayaWordmark className="font-bold text-xs" />
                    <span>•</span>
                    <span className="text-text-muted">Attributed Answer</span>
                  </div>

                  <p className="text-text-primary leading-relaxed">
                    {inputMode === "upload"
                      ? "The research paper measured a 40% reduction in retrieval latency using HNSW vector indexing in pgvector compared to standard flat scans."
                      : "You discussed using Redis for background jobs with Rahul. You decided to use ARQ with FastAPI for asynchronous task execution."}
                  </p>

                  {/* Verified Source Citation */}
                  <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <span>Source:</span>
                      <span className="font-mono text-accent-sky">
                        {inputMode === "upload"
                          ? "Research Paper.pdf §3.2"
                          : "Memory · Discussion with Rahul"}
                      </span>
                    </span>
                    <span className="font-mono text-emerald-400">SOURCE VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Composer Preview */}
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between rounded-lg bg-surface-primary px-3 py-2 border border-border-subtle text-xs text-text-muted">
            <span>Ask about past discussions, daily logs, or documents...</span>
            <span className="flex h-6 w-6 items-center justify-center rounded bg-accent-sky text-black text-xs font-bold">
              ↑
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
