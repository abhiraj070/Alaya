import HeroChatDemo from "./HeroChatDemo";
import HeroBackground from "./HeroBackground";

export default function Hero() {
  const highlights = [
    {
      title: "Documents & Files",
      desc: "Upload PDFs, DOCX, spreadsheets & slides",
      icon: (
        <svg className="h-4 w-4 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      title: "Personal Memories",
      desc: "Record daily logs, discussions & decisions",
      icon: (
        <svg className="h-4 w-4 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
    {
      title: "Conversational Recall",
      desc: "Ask questions later to retrieve any saved memory",
      icon: (
        <svg className="h-4 w-4 text-accent-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-18 md:pb-28">
      {/* Code-Generated Background (Atmospheric radial glow, technical grid, sparse particles) */}
      <HeroBackground />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Core Positioning Copy & CTAs */}
          <div className="flex flex-col text-left lg:col-span-5">
            {/* Introductory Badge */}
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-border-strong bg-surface-secondary px-3 py-1 text-xs font-semibold tracking-wider text-text-secondary uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-sky" />
              <span>Documents & Personal Memories</span>
            </div>

            {/* Revised Main Headline */}
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-6xl leading-[1.08]">
              Your documents & experiences. <br />
              <span className="text-accent-sky drop-shadow-[0_0_24px_rgba(56,189,248,0.3)]">
                A conversation away.
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-text-secondary">
              Upload documents or tell Alaya what happened today in your own words—decisions
              made, discussions held, ideas, or accomplishments. Ask questions anytime and
              recall everything through natural conversation.
            </p>

            {/* Highlighted CTA */}
            <div className="mt-8 flex items-center">
              <a
                href="#how-it-works"
                className="btn-primary group h-12 px-7 text-sm font-semibold tracking-wide uppercase shadow-[0_0_24px_rgba(56,189,248,0.3)] hover:shadow-[0_0_35px_rgba(56,189,248,0.5)] inline-flex items-center"
              >
                <span>See How It Works</span>
                <svg
                  className="ml-2.5 h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </a>
            </div>

            {/* Core Capability Highlights */}
            <div className="mt-10 border-t border-border-subtle pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {highlights.map((item, idx) => (
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

          {/* Right Column: Hero Interactive Chat & Knowledge Base Demonstration */}
          <div className="relative w-full lg:col-span-7">
            <HeroChatDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
