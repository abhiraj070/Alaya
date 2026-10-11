"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "How does Alaya remember my daily experiences and decisions?",
    a: "You can feed information directly into Alaya by writing in natural language—whether it's an accomplishment, a meeting decision, an internship interview reflection, or a project idea. Alaya indexes your text alongside uploaded documents, allowing you to ask questions about those moments later.",
  },
  {
    q: "Can I use Alaya without uploading any files?",
    a: "Yes. You can use Alaya purely as a personal memory repository. Record your daily experiences, architectural decisions, and thoughts directly in your own words, then query them naturally through conversational Chat.",
  },
  {
    q: "What document formats are supported for file uploads?",
    a: "Alaya supports PDF, DOCX, XLSX, TXT, PPTX, CSV, and common image formats. Text within images and scanned documents is extracted using OCR during indexing.",
  },
  {
    q: "Does Alaya automatically record my life or background activity?",
    a: "No. Alaya never listens in the background, tracks external applications, or automatically ingests private data without your explicit action. It only stores what you deliberately upload as files or enter as written memories.",
  },
  {
    q: "How do source citations work for written memories?",
    a: "When you ask a question that draws upon a personal memory you recorded, Alaya grounds its answer in that specific entry and displays a citation badge (e.g., 'Memory · Discussion with Rahul') indicating the exact recorded context.",
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
            Clear answers about personal memories, document indexing, source citations, and privacy.
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
