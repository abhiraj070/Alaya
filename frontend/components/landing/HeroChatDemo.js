"use client";

import { useState, useEffect } from "react";
import AlayaWordmark from "@/components/ui/AlayaWordmark";

const SAMPLE_QUESTION = "What are the main findings of my research paper?";

const SAMPLE_RESPONSE_POINTS = [
  "Hybrid retrieval yields 99.2% accuracy by combining vector embeddings with metadata filters.",
  "Document chunking with 128-token overlap eliminated context truncation across 18 pages.",
  "Every generated claim is directly linked to verifiable source citations in your Knowledge Base.",
];

export default function HeroChatDemo() {
  const [typedText, setTypedText] = useState("");
  const [statePhase, setStatePhase] = useState("typing"); // "typing" -> "sent" -> "thinking" -> "responding" -> "idle"
  const [responseIndex, setResponseIndex] = useState(0);

  // Typing and response animation cycle
  useEffect(() => {
    let timer;

    if (statePhase === "typing") {
      if (typedText.length < SAMPLE_QUESTION.length) {
        timer = setTimeout(() => {
          setTypedText(SAMPLE_QUESTION.slice(0, typedText.length + 1));
        }, 45);
      } else {
        // Finished typing question, pause briefly before sending
        timer = setTimeout(() => {
          setStatePhase("sent");
        }, 800);
      }
    } else if (statePhase === "sent") {
      // Simulate click send & thinking
      timer = setTimeout(() => {
        setStatePhase("thinking");
      }, 500);
    } else if (statePhase === "thinking") {
      // Brief processing indicator
      timer = setTimeout(() => {
        setStatePhase("responding");
        setResponseIndex(1);
      }, 1000);
    } else if (statePhase === "responding") {
      if (responseIndex < SAMPLE_RESPONSE_POINTS.length) {
        timer = setTimeout(() => {
          setResponseIndex((prev) => prev + 1);
        }, 700);
      } else {
        // Finished response, stay idle for a few seconds then restart loop
        timer = setTimeout(() => {
          setStatePhase("idle");
        }, 5000);
      }
    } else if (statePhase === "idle") {
      timer = setTimeout(() => {
        setTypedText("");
        setResponseIndex(0);
        setStatePhase("typing");
      }, 2000);
    }

    return () => clearTimeout(timer);
  }, [statePhase, typedText, responseIndex]);

  const handleManualReplay = () => {
    setTypedText("");
    setResponseIndex(0);
    setStatePhase("typing");
  };

  return (
    <div className="relative w-full rounded-2xl border border-border-strong bg-surface-primary/90 p-3 sm:p-5 shadow-2xl backdrop-blur-xl h-[560px] lg:h-[490px] flex flex-col justify-between overflow-hidden">
      {/* Window Title Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 text-xs font-mono text-text-muted">alaya-workspace / knowledge-chat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-mono text-text-secondary">3 Documents Active</span>
        </div>
      </div>

      {/* Main Grid: Knowledge Base Sidebar + Chat Interface (Fixed height container) */}
      <div className="mt-3.5 grid grid-cols-1 gap-4 lg:grid-cols-12 flex-1 min-h-0">
        {/* A. Knowledge Base Panel (col-span-4, fixed height) */}
        <div className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-secondary/60 p-3 lg:col-span-4 h-full min-h-0 overflow-hidden">
          <div>
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="text-[11px] font-semibold text-text-primary uppercase tracking-wider">
                Knowledge Base
              </span>
              <span className="rounded bg-accent-sky/10 px-1.5 py-0.5 text-[9px] font-mono text-accent-sky border border-accent-sky/20">
                UPLOADED
              </span>
            </div>

            {/* Uploaded Document Cards */}
            <div className="flex flex-col gap-2 mt-2">
              {/* Document 1: PDF */}
              <div className="flex items-center gap-2.5 rounded-lg border border-accent-sky/30 bg-surface-primary/80 p-2 shadow-sm transition-colors">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-rose-500/20 bg-rose-500/10 text-[10px] font-bold text-rose-400">
                  PDF
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text-primary">Research Paper.pdf</p>
                  <p className="text-[10px] text-text-muted">2.4 MB • 18 pages</p>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-accent-sky" title="Active in retrieval" />
              </div>

              {/* Document 2: DOCX */}
              <div className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-primary/50 p-2 transition-colors">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-sky-500/20 bg-sky-500/10 text-[10px] font-bold text-sky-400">
                  DOCX
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text-primary">Project Notes.docx</p>
                  <p className="text-[10px] text-text-muted">1.1 MB • 12 sections</p>
                </div>
              </div>

              {/* Document 3: XLSX */}
              <div className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-primary/50 p-2 transition-colors">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
                  XLSX
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text-primary">Financial Report.xlsx</p>
                  <p className="text-[10px] text-text-muted">3.8 MB • 4 sheets</p>
                </div>
              </div>
            </div>
          </div>

          {/* Simple File Upload Indicator */}
          <div className="mt-2 rounded-lg border border-dashed border-border-subtle bg-surface-primary/30 p-2 text-center shrink-0">
            <span className="text-[10px] text-text-muted flex items-center justify-center gap-1">
              <svg className="h-3 w-3 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload documents only
            </span>
          </div>
        </div>

        {/* B & C. Conversational Chat Interface (col-span-8, fixed height, no layout shift) */}
        <div className="flex flex-col justify-between rounded-xl border border-border-strong bg-surface-secondary/70 p-3 sm:p-4 lg:col-span-8 h-full min-h-0 overflow-hidden">
          {/* Chat Stream Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border-subtle pb-2 text-[11px] font-mono text-text-muted">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent-sky" />
              <span className="font-semibold text-text-primary">Knowledge Assistant</span>
            </div>
            <button
              type="button"
              onClick={handleManualReplay}
              className="text-text-muted hover:text-accent-sky text-[10px] transition-colors"
            >
              Replay demo ↺
            </button>
          </div>

          {/* Messages Container (Fixed available height, anchored to bottom, no expansion) */}
          <div className="my-2 flex-1 min-h-0 flex flex-col justify-end space-y-2.5 overflow-hidden">
            {/* User Message */}
            {statePhase !== "typing" && (
              <div className="flex justify-end shrink-0">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-surface-tertiary px-3.5 py-2 text-xs text-text-primary border border-border-strong shadow-sm">
                  {SAMPLE_QUESTION}
                </div>
              </div>
            )}

            {/* Alaya Thinking State */}
            {statePhase === "thinking" && (
              <div className="flex justify-start items-center gap-2 text-xs text-accent-sky font-mono py-1 shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-sky opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-sky" />
                </span>
                <span>Searching Research Paper.pdf...</span>
              </div>
            )}

            {/* C. Alaya Response Message */}
            {(statePhase === "responding" || statePhase === "idle") && (
              <div className="flex justify-start shrink-0">
                <div className="max-w-[95%] rounded-2xl rounded-tl-sm bg-surface-primary border border-accent-sky/30 p-3 shadow-lg text-xs">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono mb-1.5">
                    <AlayaWordmark className="font-bold tracking-wider text-xs" />
                    <span>•</span>
                    <span className="text-text-muted">Answers grounded in your documents</span>
                  </div>

                  <p className="font-medium text-text-primary text-[11px]">
                    The main findings of your research paper are:
                  </p>

                  <ul className="mt-1.5 space-y-1 text-text-secondary text-[11px]">
                    {SAMPLE_RESPONSE_POINTS.slice(0, responseIndex).map((point, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-accent-sky font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Grounded Sources */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-2 text-[10px]">
                    <span className="text-text-muted">Verified Sources:</span>
                    <span className="rounded bg-surface-secondary px-2 py-0.5 font-mono text-accent-sky border border-border-subtle">
                      Research Paper.pdf §3.2
                    </span>
                    <span className="rounded bg-surface-secondary px-2 py-0.5 font-mono text-accent-sky border border-border-subtle">
                      Project Notes.docx
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* B. ChatGPT-Inspired Message Composer (Pinned at bottom, fixed height) */}
          <div className="relative mt-2 shrink-0">
            <div className="relative flex items-center rounded-xl border border-border-strong bg-surface-primary px-3 py-2 shadow-inner transition-all focus-within:border-accent-sky focus-within:ring-1 focus-within:ring-accent-sky">
              {/* Composer Input Display */}
              <div className="flex-1 font-sans text-xs text-text-primary min-h-[22px] flex items-center">
                {statePhase === "typing" ? (
                  <span>
                    {typedText}
                    <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-accent-sky animate-pulse align-middle" />
                  </span>
                ) : (
                  <span className="text-text-muted">Ask anything about your uploaded documents...</span>
                )}
              </div>

              {/* Send Button */}
              <button
                type="button"
                className={`ml-2 flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                  statePhase === "sent" || statePhase === "typing"
                    ? "bg-accent-sky text-black shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                    : "bg-surface-secondary text-text-muted"
                }`}
                aria-label="Send message"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>

            <p className="mt-1.5 text-center text-[10px] text-text-muted">
              Alaya answers exclusively from your uploaded Knowledge Base.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
