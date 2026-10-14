import HeroChatDemo from "./HeroChatDemo";
import HeroBackground from "./HeroBackground";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-10 md:pt-18 md:pb-14 border-b border-border-subtle">
      {/* Code-Generated Background (Atmospheric radial glow, technical grid, sparse particles) */}
      <HeroBackground />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Core Positioning Copy & CTAs */}
          <div className="flex flex-col text-left lg:col-span-5">
            {/* Revised Main Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-6xl leading-[1.08]">
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
                className="btn-primary group h-12 px-7 text-sm font-semibold tracking-wide uppercase inline-flex items-center"
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
