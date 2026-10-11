"use client";

import { useState, useEffect } from "react";
import AlayaWordmark from "@/components/ui/AlayaWordmark";

const SAMPLE_QUESTION = "What did we decide about background jobs?";

const SAMPLE_RESPONSE_POINTS = [
  "You and Rahul decided to use Redis with ARQ for background jobs and task queueing.",
  "The decision was agreed upon during your architecture discussion today.",
  "Project Notes.docx also confirms Redis integration with PostgreSQL connection pools.",
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
        timer = setTimeout(() => {
          setStatePhase("sent");
        }, 800);
      }
    } else if (statePhase === "sent") {
      timer = setTimeout(() => {
        setStatePhase("thinking");
      }, 500);
    } else if (statePhase === "thinking") {
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
          <span className="text-[11px] font-mono text-text-secondary">2 Documents · 1 Memory</span>
        </div>
      </div>

      {/* Main Grid: Knowledge Base Sidebar (Dual Input) + Chat Interface */}
      <div className="mt-3.5 grid grid-cols-1 gap-4 lg:grid-cols-12 flex-1 min-h-0">
        {/* A. Knowledge Base Panel (col-span-4, fixed height, Dual Input) */}
        <div className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-secondary/60 p-3 lg:col-span-4 h-full min-h-0 overflow-hidden">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-1.5">
              <span className="text-[11px] font-semibold text-text-primary uppercase tracking-wider">
                Knowledge Base
              </span>
              <span className="rounded bg-accent-sky/10 px-1.5 py-0.5 text-[9px] font-mono text-accent-sky border border-accent-sky/20">
                UNIFIED
              </span>
            </div>

            {/* Input A: Uploaded Documents */}
            <div>
              <span className="text-[9px] font-mono tracking-wider text-text-muted uppercase block mb-1">
                A. DOCUMENTS
              </span>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-primary/80 p-1.5 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-rose-500/20 bg-rose-500/10 text-[9px] font-bold text-rose-400">
                    PDF
                  </span>
                  <p className="truncate text-[11px] font-medium text-text-primary flex-1">Research Paper.pdf</p>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-sky" />
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-primary/80 p-1.5 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-sky-500/20 bg-sky-500/10 text-[9px] font-bold text-sky-400">
                    DOCX
                  </span>
                  <p className="truncate text-[11px] font-medium text-text-primary flex-1">Project Notes.docx</p>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-sky" />
                </div>
              </div>
            </div>

            {/* Input B: Natural-Language Knowledge / Memory */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono tracking-wider text-text-muted uppercase">
                  B. MEMORIES
                </span>
                <span className="text-[9px] font-mono text-emerald-400">SAVED ✓</span>
              </div>
              <div className="rounded-lg border border-accent-sky/30 bg-surface-primary/95 p-2 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-accent-sky font-mono mb-1">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span className="font-semibold">Recorded Memory</span>
                </div>
                <p className="text-[10px] text-text-secondary leading-snug italic">
                  &ldquo;Discussed architecture with Rahul. We decided to use Redis with ARQ for background jobs.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Conceptual Relationship Note */}
          <div className="mt-2 rounded-lg border border-dashed border-border-subtle bg-surface-primary/30 p-1.5 text-center shrink-0">
            <span className="text-[9px] text-text-muted font-mono block">
              Documents & Memories → Unified Knowledge Base
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

          {/* Messages Container (Fixed available height, anchored to bottom, zero layout shift) */}
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
                <span>Synthesizing from Knowledge Base...</span>
              </div>
            )}

            {/* C. Alaya Response Message */}
            {(statePhase === "responding" || statePhase === "idle") && (
              <div className="flex justify-start shrink-0">
                <div className="max-w-[95%] rounded-2xl rounded-tl-sm bg-surface-primary border border-accent-sky/30 p-3 shadow-lg text-xs">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono mb-1.5">
                    <AlayaWordmark className="font-bold tracking-wider text-xs" />
                    <span>•</span>
                    <span className="text-text-muted">Grounded in your Knowledge Base</span>
                  </div>

                  <p className="font-medium text-text-primary text-[11px]">
                    Based on your Knowledge Base:
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
                    <span className="text-text-muted">Source Citations:</span>
                    <span className="rounded bg-surface-secondary px-2 py-0.5 font-mono text-accent-sky border border-border-subtle">
                      Memory · Discussion with Rahul
                    </span>
                    <span className="rounded bg-surface-secondary px-2 py-0.5 font-mono text-accent-sky border border-border-subtle">
                      Project Notes.docx §2.1
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ChatGPT-Inspired Message Composer (Pinned at bottom, fixed height) */}
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
                  <span className="text-text-muted">Ask about your documents, decisions, or daily experiences...</span>
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
              Answers are synthesized exclusively from your Knowledge Base.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
