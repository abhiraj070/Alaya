import Link from "next/link";
import DocumentFlow from "./DocumentFlow";
import HeroBackground from "./HeroBackground";

export default function Hero() {
  const capabilities = [
    {
      title: "Multiple file formats",
      desc: "PDF, DOCX, XLSX, TXT, PPTX & Images",
      icon: (
        <svg className="h-4 w-4 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      title: "AI extraction & understanding",
      desc: "Vector embeddings & structured metadata",
      icon: (
        <svg className="h-4 w-4 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      title: "Chat with your knowledge",
      desc: "Accurate conversational answers & citations",
      icon: (
        <svg className="h-4 w-4 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* 1. Code-Generated Background (Atmosphere, Grid, Subtle Lights) */}
      <HeroBackground />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Hero Copy & Actions (col-span-5 or col-span-6) */}
          <div className="flex flex-col text-left lg:col-span-5">
            {/* Small Introductory Label Badge */}
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-border-strong bg-surface-secondary px-3 py-1 text-xs font-semibold tracking-wider text-text-secondary uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-sky" />
              <span>AI-Powered Personal Knowledge Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-6xl leading-[1.08]">
              Your knowledge. <br />
              <span className="text-accent-sky drop-shadow-[0_0_24px_rgba(56,189,248,0.3)]">
                One intelligent interface.
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-text-secondary">
              Alaya helps you extract, understand, and chat with your documents.
              Turn your files into a living knowledge base and get accurate answers.
            </p>

            {/* Primary and Secondary CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/auth?mode=signup"
                className="btn-primary group h-11 px-6 text-sm font-semibold tracking-wide uppercase shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_28px_rgba(56,189,248,0.4)]"
              >
                <span>Get Started</span>
                <svg
                  className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>

              <a
                href="#how-it-works"
                className="btn-secondary h-11 px-6 text-sm font-medium hover:border-border-strong hover:bg-surface-tertiary"
              >
                See How It Works
              </a>
            </div>

            {/* Three Concise Capability Highlights */}
            <div className="mt-10 border-t border-border-subtle pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {capabilities.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      {item.icon}
                      <span className="text-xs font-semibold text-text-primary">
                        {item.title}
                      </span>
                    </div>
                    <span className="mt-1 text-[11px] text-text-muted leading-tight">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Animated Document-to-Knowledge Visualization (col-span-7) */}
          <div className="relative w-full lg:col-span-7">
            <DocumentFlow />
          </div>
        </div>
      </div>
    </section>
  );
}
