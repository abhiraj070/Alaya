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
    <div className="relative w-full rounded-2xl border border-border-strong bg-surface-primary/90 p-3 sm:p-5 shadow-2xl backdrop-blur-xl h-[620px] sm:h-[580px] lg:h-[490px] flex flex-col justify-between overflow-hidden">
      {/* Window Title Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 text-xs font-mono text-text-muted">alaya-workspace / knowledge-base</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-mono text-text-secondary">2 Documents · 1 Memory</span>
        </div>
      </div>

      {/* Main Grid: Knowledge Base Sidebar + Chat Interface */}
      <div className="mt-3.5 grid grid-cols-1 gap-4 lg:grid-cols-12 flex-1 min-h-0">
        {/* Left Column: Knowledge Base (Stored Sources) */}
        <div className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-secondary/60 p-3 lg:col-span-4 h-full min-h-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="text-xs font-semibold text-text-primary tracking-wide">
                Knowledge Base
              </span>
              <span className="text-[10px] font-mono text-accent-sky bg-accent-sky/10 border border-accent-sky/20 px-2 py-0.5 rounded-full">
                3 entries
              </span>
            </div>

            {/* Document Sources */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-medium tracking-wider text-text-muted uppercase block">
                Documents
              </span>
              <div className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-primary/80 px-2.5 py-2 text-xs">
                <span className="flex h-5 w-6 shrink-0 items-center justify-center rounded bg-rose-500/10 text-[9px] font-bold text-rose-400 border border-rose-500/20">
                  PDF
                </span>
                <span className="truncate text-xs text-text-primary flex-1 font-medium">Research Paper.pdf</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-primary/80 px-2.5 py-2 text-xs">
                <span className="flex h-5 w-6 shrink-0 items-center justify-center rounded bg-sky-500/10 text-[9px] font-bold text-sky-400 border border-sky-500/20">
                  DOCX
                </span>
                <span className="truncate text-xs text-text-primary flex-1 font-medium">Project Notes.docx</span>
              </div>
            </div>

            {/* Written Personal Memory */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-medium tracking-wider text-text-muted uppercase block">
                Daily Memory
              </span>
              <div className="rounded-lg border border-border-subtle bg-surface-primary/80 p-2.5 text-xs">
                <div className="flex items-center gap-1.5 text-[10px] text-accent-sky font-medium mb-1">
                  <span>💭</span>
                  <span>Architecture Discussion</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed italic">
                  &ldquo;Discussed architecture with Rahul. We decided to use Redis with ARQ for background jobs.&rdquo;
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center text-[10px] text-text-muted border-t border-border-subtle/50 mt-2">
            <span>Indexed and searchable in Chat</span>
          </div>
        </div>

        {/* Right Column: Conversational Chat */}
        <div className="flex flex-col justify-between rounded-xl border border-border-strong bg-surface-secondary/70 p-3 sm:p-4 lg:col-span-8 h-full min-h-0">
          {/* Chat Stream Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border-subtle pb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent-sky" />
              <span className="font-semibold text-text-primary text-xs">Chat Assistant</span>
            </div>
            <button
              type="button"
              onClick={handleManualReplay}
              className="text-text-muted hover:text-accent-sky text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Replay demo</span>
              <span>↺</span>
            </button>
          </div>

          {/* Messages Flow */}
          <div className="my-2.5 flex-1 min-h-0 overflow-y-auto chat-scrollbar space-y-3 pr-1">
            {/* User Message */}
            {statePhase !== "typing" && (
              <div className="flex justify-end animate-fadeIn">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-surface-tertiary px-3.5 py-2 text-xs sm:text-sm text-text-primary border border-border-strong shadow-xs">
                  {SAMPLE_QUESTION}
                </div>
              </div>
            )}

            {/* Alaya Thinking State */}
            {statePhase === "thinking" && (
              <div className="flex items-center gap-2 text-xs text-accent-sky font-mono py-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-sky opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-sky" />
                </span>
                <span>Searching Knowledge Base...</span>
              </div>
            )}

            {/* Alaya Response Message */}
            {(statePhase === "responding" || statePhase === "idle") && (
              <div className="flex justify-start animate-fadeIn">
                <div className="w-full max-w-[95%] rounded-2xl rounded-tl-sm bg-surface-primary border border-accent-sky/30 p-3.5 shadow-md text-xs sm:text-[13px] min-h-[175px] flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs mb-2">
                    <AlayaWordmark className="font-bold text-xs" />
                    <span className="text-text-muted">· Grounded Answer</span>
                  </div>

                  <p className="font-semibold text-text-primary mb-1.5 text-xs">
                    Based on your Knowledge Base:
                  </p>

                  <ul className="space-y-1 text-text-secondary text-xs">
                    {SAMPLE_RESPONSE_POINTS.slice(0, responseIndex).map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-accent-sky font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Grounded Sources */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-2.5 text-[11px]">
                    <span className="text-text-muted">Sources:</span>
                    <span className="inline-flex items-center gap-1 rounded bg-surface-secondary px-2 py-0.5 font-medium text-accent-sky border border-border-subtle">
                      <span>🧠</span> Memory: Discussion with Rahul
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-surface-secondary px-2 py-0.5 font-medium text-accent-sky border border-border-subtle">
                      <span>📄</span> Project Notes.docx §2.1
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Composer */}
          <div className="relative mt-1 shrink-0">
            <div className="relative flex items-center rounded-xl border border-border-strong bg-surface-primary px-3 py-2 shadow-inner focus-within:border-accent-sky focus-within:ring-1 focus-within:ring-accent-sky">
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
                    ? "bg-accent-sky text-black shadow-xs"
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

            <p className="mt-1 text-center text-[10px] text-text-muted">
              Answers are synthesized exclusively from your Knowledge Base.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
