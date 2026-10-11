"use client";

import { useState } from "react";
import AlayaWordmark from "@/components/ui/AlayaWordmark";

const DEMO_PRESETS = [
  {
    id: 1,
    stageNum: 1,
    title: "1. Upload Documents",
    docContext: "3 Documents Added to Knowledge Base",
    question: "Upload complete: Research Paper.pdf, Project Notes.docx, Financial Report.xlsx",
    summary: "Files are stored securely in your private workspace. No manual tagging needed.",
    actionTitle: "Supported File Types",
    actionDetail: "PDF, DOCX, XLSX, TXT, PPTX & Images directly ingested.",
    type: "upload",
  },
  {
    id: 2,
    stageNum: 2,
    title: "2. Prepare Knowledge",
    docContext: "Parsing & Extracting Chunks",
    question: "How does Alaya index these files?",
    summary: "Alaya breaks files into overlapping semantic chunks, extracts structured facts, and creates vector embeddings.",
    actionTitle: "Knowledge Ready",
    actionDetail: "1,536-dimensional embeddings linked to metadata for hybrid retrieval.",
    type: "extract",
  },
  {
    id: 3,
    stageNum: 3,
    title: "3. Ask in Chat",
    docContext: "Conversational Composer Active",
    question: "What were our main research findings on system latency?",
    summary: "Typing natural questions searches your private Knowledge Base instead of generic web content.",
    actionTitle: "Natural Language Query",
    actionDetail: "Alaya understands complex multi-topic and comparative questions.",
    type: "ask",
  },
  {
    id: 4,
    stageNum: 4,
    title: "4. Receive Answers",
    docContext: "Grounded Answer Synthesized",
    question: "Can you provide the specific latency metrics from §3.2?",
    summary: "Latency p95 dropped from 320ms to 94ms following the pgvector HNSW index rollout. Verified in Research Paper.pdf (page 14).",
    actionTitle: "Exact Citations",
    actionDetail: "Direct citation links verify every single statement.",
    type: "answer",
  },
];

export default function WorkflowDemo({ activeStage, onSelectStage }) {
  const [selectedPresetId, setSelectedPresetId] = useState(activeStage);

  const currentPreset = DEMO_PRESETS.find((p) => p.stageNum === activeStage) || DEMO_PRESETS[0];

  return (
    <div className="relative mt-8 w-full rounded-2xl border border-border-strong bg-surface-primary/80 p-5 sm:p-7 backdrop-blur-md shadow-2xl">
      {/* Top Header: Active Stage Context & Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-sky opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-sky" />
          </span>
          <span className="text-xs font-mono font-semibold text-text-primary">
            {currentPreset.title}
          </span>
          <span className="text-text-muted text-xs">•</span>
          <span className="text-xs text-text-secondary">{currentPreset.docContext}</span>
        </div>

        {/* Quick Stage Buttons */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => onSelectStage(step)}
              className={`h-7 px-2.5 rounded text-[11px] font-mono transition-all ${
                activeStage === step
                  ? "border border-accent-sky/50 bg-surface-secondary text-accent-sky shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                  : "border border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              Step {step}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Chat Preview (Conversation Prioritized) */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Context Document Card List (Compact context) */}
        <div className="lg:col-span-4 flex flex-col gap-2.5">
          <span className="text-[10px] font-mono tracking-wider text-text-muted uppercase">
            ACTIVE KNOWLEDGE BASE
          </span>
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-secondary/70 p-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded border border-rose-500/20 bg-rose-500/10 text-[9px] font-bold text-rose-400">
              PDF
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text-primary">Research Paper.pdf</p>
              <p className="text-[10px] text-text-muted">18 pages • Latency analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-secondary/70 p-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded border border-sky-500/20 bg-sky-500/10 text-[9px] font-bold text-sky-400">
              DOCX
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text-primary">Project Notes.docx</p>
              <p className="text-[10px] text-text-muted">Architecture specs</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-secondary/70 p-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded border border-emerald-500/20 bg-emerald-500/10 text-[9px] font-bold text-emerald-400">
              XLSX
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text-primary">Financial Report.xlsx</p>
              <p className="text-[10px] text-text-muted">Q3 telemetry metrics</p>
            </div>
          </div>
        </div>

        {/* Right: Simulated Chat Conversation */}
        <div className="lg:col-span-8 flex flex-col justify-between rounded-xl border border-border-strong bg-surface-secondary/80 p-4 min-h-[260px]">
          <div className="space-y-3">
            {/* User Question Bubble */}
            <div className="flex justify-end">
              <div className="max-w-[90%] rounded-xl rounded-tr-sm bg-surface-tertiary px-3.5 py-2 text-xs text-text-primary border border-border-strong">
                "{currentPreset.question}"
              </div>
            </div>

            {/* Alaya Synthesized Answer Bubble */}
            <div className="flex justify-start">
              <div className="max-w-[95%] rounded-xl rounded-tl-sm bg-surface-primary border border-accent-sky/30 p-3.5 text-xs">
                <div className="flex items-center gap-1.5 text-[10px] font-mono mb-1.5">
                  <AlayaWordmark className="font-bold text-xs" />
                  <span>•</span>
                  <span>{currentPreset.actionTitle}</span>
                </div>
                <p className="text-text-primary leading-relaxed">
                  {currentPreset.summary}
                </p>
                <div className="mt-2.5 flex items-center justify-between border-t border-border-subtle pt-2 text-[10px] text-text-muted font-mono">
                  <span>{currentPreset.actionDetail}</span>
                  <span className="text-accent-sky">GROUNDED</span>
                </div>
              </div>
            </div>
          </div>

          {/* ChatGPT-Inspired Message Composer Preview */}
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between rounded-lg bg-surface-primary px-3 py-2 border border-border-subtle">
            <span className="text-xs text-text-muted font-sans">
              Ask Alaya a follow-up question...
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded bg-accent-sky text-black text-xs font-bold shadow-sm">
              ↑
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
