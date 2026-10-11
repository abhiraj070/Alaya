"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "How does Alaya ensure answers remain grounded in my data?",
    a: "Alaya operates on retrieval-augmented generation (RAG) strictly scoped to your Knowledge Base. When you ask a question in Chat, Alaya first retrieves relevant excerpts and metadata from your indexed documents and memories, using that verified context to formulate the response.",
  },
  {
    q: "What document formats are supported?",
    a: "Alaya supports PDF, DOCX, XLSX, TXT, PPTX, CSV, Markdown, and common image formats. Text within images and scanned documents is extracted using OCR during indexing.",
  },
  {
    q: "Can I record notes without uploading a file?",
    a: "Yes. With written memories, you can directly log thoughts, decisions, or meeting notes in natural language. Alaya indexes these memories into your Knowledge Base alongside uploaded documents, making them searchable in Chat.",
  },
  {
    q: "How do source citations work?",
    a: "Every answer generated in Chat includes attribution badges showing the exact document, section, page, or memory entry that supplied the underlying facts.",
  },
  {
    q: "Is my Knowledge Base private and secure?",
    a: "Yes. All documents, memories, embeddings, and chat histories are strictly isolated to your authenticated account. Your data is never shared across users or used to train public foundation models.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="relative scroll-mt-20 py-20 md:py-28 bg-bg-primary border-t border-border-subtle">
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-secondary px-3 py-1 text-xs font-semibold tracking-wider text-accent-sky uppercase">
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
            Everything you need to know.
          </h2>
          <p className="mt-3 text-base text-text-secondary">
            Clear answers about indexing, supported formats, source citations, and privacy.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="mt-12 space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-xl border border-border-subtle bg-surface-primary/70 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="flex w-full items-center justify-between p-5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-semibold text-text-primary">
                    {item.q}
                  </span>
                  <span
                    className={`ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border-strong text-accent-sky transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-border-subtle px-5 pb-5 pt-3 text-xs sm:text-sm leading-relaxed text-text-secondary">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
