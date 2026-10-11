"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "How does Alaya answer questions without hallucinating?",
    a: "Alaya relies exclusively on your uploaded Knowledge Base. When you submit a question in Chat, Alaya retrieves the most relevant semantic chunks and metadata facts from your files, assembling verified context before generating the conversational answer.",
  },
  {
    q: "What document formats are supported for upload?",
    a: "Alaya natively ingests PDF, DOCX, XLSX, TXT, PPTX, CSV, Markdown, and image uploads (processed via OCR and vision models). No external web links or text paste required.",
  },
  {
    q: "Can I add information without uploading a document?",
    a: "Yes! You can directly record thoughts, decisions, notes, or preferences in plain natural language through the 'Add Knowledge' feature. Alaya indexes these written memories alongside your uploaded files and retrieves them seamlessly during chat.",
  },
  {
    q: "How do citations and source references work?",
    a: "Every response in the chat interface includes transparent citation badges. You can see precisely which document, section, page, or written memory contributed to each fact in the answer.",
  },
  {
    q: "Is my uploaded knowledge private and secure?",
    a: "Yes. All uploaded files, chunks, embeddings, and chat sessions are strictly scoped to your authenticated account. Your files are never used to train public foundational models.",
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
            Common questions about document ingestion, knowledge extraction, and conversational retrieval.
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
