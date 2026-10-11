export default function AlayaCore({ isProcessing = true }) {
  return (
    <div className="relative flex h-48 w-48 sm:h-52 sm:w-52 items-center justify-center">
      {/* 1. Ambient Background Core Glow */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-500 ${
          isProcessing ? "opacity-40" : "opacity-20"
        }`}
        style={{
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, transparent 70%)",
        }}
      />

      {/* 2. Outer SVG Orbital Ring Systems */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="core-glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#7DD3FC" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Outer Orbit (Clockwise) */}
        <g className="animate-spin-slow origin-center">
          <circle
            cx="100"
            cy="100"
            r="88"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />
          <circle
            cx="100"
            cy="100"
            r="88"
            stroke="url(#core-glow-grad)"
            strokeWidth="1.5"
            strokeDasharray="16 72"
            strokeLinecap="round"
          />
          {/* Orbital Satellite Node */}
          <circle cx="100" cy="12" r="2.5" fill="#38BDF8" />
        </g>

        {/* Mid Orbit (Counter-Clockwise) */}
        <g className="animate-spin-reverse-slow origin-center">
          <circle
            cx="100"
            cy="100"
            r="70"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="1"
          />
          <circle
            cx="100"
            cy="100"
            r="70"
            stroke="#38BDF8"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="6 28"
          />
          {/* Orbital Satellite Node 2 */}
          <circle cx="170" cy="100" r="2" fill="#7DD3FC" />
        </g>

        {/* Inner Static Boundary Ring */}
        <circle
          cx="100"
          cy="100"
          r="54"
          stroke="rgba(56, 189, 248, 0.2)"
          strokeWidth="1"
        />
      </svg>

      {/* 3. Central Geometric Core Container */}
      <div
        className={`relative flex h-24 w-24 sm:h-28 sm:w-28 flex-col items-center justify-center rounded-2xl border bg-surface-primary p-3 shadow-2xl transition-all duration-300 ${
          isProcessing
            ? "border-accent-sky shadow-[0_0_30px_rgba(56,189,248,0.25)]"
            : "border-border-strong"
        }`}
      >
        {/* Pulsing Nucleus */}
        <div
          className={`absolute inset-2 rounded-xl bg-gradient-to-br from-accent-sky/15 via-transparent to-accent-sky/5 transition-opacity ${
            isProcessing ? "animate-pulse-glow opacity-100" : "opacity-30"
          }`}
        />

        {/* Central Geometric Icon */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <svg
            className={`h-7 w-7 transition-all duration-300 ${
              isProcessing ? "text-accent-sky scale-105" : "text-text-secondary"
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
            <line x1="12" y1="22" x2="12" y2="15.5" />
            <polyline points="22 8.5 12 15.5 2 8.5" />
            <polyline points="2 15.5 12 8.5 22 15.5" />
            <line x1="12" y1="2" x2="12" y2="8.5" />
          </svg>

          {/* Wordmark */}
          <span className="mt-1 text-[11px] font-bold tracking-[0.25em] text-text-primary uppercase">
            ALAYA
          </span>
          <span className="text-[8px] font-semibold tracking-wider text-accent-sky uppercase">
            CORE
          </span>
        </div>

        {/* Status Indicator */}
        <div className="absolute -bottom-2.5 rounded-full border border-border-strong bg-surface-secondary px-2 py-0.5 text-[8px] font-medium tracking-wider text-accent-sky uppercase shadow-sm">
          {isProcessing ? "ACTIVE" : "READY"}
        </div>
      </div>
    </div>
  );
}
