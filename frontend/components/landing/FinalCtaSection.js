import Link from "next/link";

export default function FinalCtaSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-bg-primary border-t border-border-subtle">
      {/* Subtle Ambient Glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[450px] w-[750px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[130px]"
        style={{
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-secondary px-3 py-1 text-xs font-semibold tracking-wider text-accent-sky uppercase">
          <span>GET STARTED TODAY</span>
        </div>

        {/* Required Headline */}
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-6xl leading-[1.1]">
          Your knowledge is already there. <br />
          <span className="text-accent-sky drop-shadow-[0_0_24px_rgba(56,189,248,0.3)]">
            Start a conversation.
          </span>
        </h2>

        {/* Supporting Description */}
        <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-text-secondary leading-relaxed">
          Create your Knowledge Base in minutes and experience conversational retrieval
          built entirely on your own data.
        </p>

        {/* Primary CTA Button */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/auth?mode=signup"
            className="btn-primary group h-12 px-8 text-sm font-semibold tracking-wide uppercase shadow-[0_0_25px_rgba(56,189,248,0.3)] hover:shadow-[0_0_35px_rgba(56,189,248,0.5)]"
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
        </div>

        <p className="mt-4 text-xs text-text-muted">
          Instant setup · Multi-format ingestion · Verifiable source citations
        </p>
      </div>
    </section>
  );
}
