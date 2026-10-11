export default function AuthBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Low-Contrast Subtle Grid Layer */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,#000_20%,transparent_100%)]" />

      {/* 2. Soft Ambient Sky-Blue Central Glow */}
      <div
        className="absolute top-1/2 left-1/2 h-[550px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35 blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, rgba(125, 211, 252, 0.05) 50%, transparent 75%)",
        }}
      />

      {/* 3. Subtle Top-Origin Backlight */}
      <div
        className="absolute -top-40 left-1/2 h-[350px] w-[700px] -translate-x-1/2 rounded-full opacity-25 blur-[100px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(56, 189, 248, 0.18) 0%, transparent 70%)",
        }}
      />

      {/* 4. Fine Technical Vector Elements (Sparse & Restrained) */}
      <svg
        className="absolute inset-0 h-full w-full opacity-30"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="auth-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0)" />
            <stop offset="50%" stopColor="rgba(56, 189, 248, 0.12)" />
            <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
          </linearGradient>
        </defs>

        {/* Delicate Alignment Lines */}
        <line
          x1="15%"
          y1="0"
          x2="15%"
          y2="100%"
          stroke="url(#auth-line-grad)"
          strokeWidth="1"
          strokeDasharray="3 9"
        />
        <line
          x1="85%"
          y1="0"
          x2="85%"
          y2="100%"
          stroke="url(#auth-line-grad)"
          strokeWidth="1"
          strokeDasharray="3 9"
        />

        {/* Minimalist Geometric Corner Crosshair Markers */}
        <g stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1">
          <line x1="8%" y1="12%" x2="8%" y2="14%" />
          <line x1="7%" y1="13%" x2="9%" y2="13%" />

          <line x1="92%" y1="12%" x2="92%" y2="14%" />
          <line x1="91%" y1="13%" x2="93%" y2="13%" />

          <line x1="8%" y1="88%" x2="8%" y2="90%" />
          <line x1="7%" y1="89%" x2="9%" y2="89%" />

          <line x1="92%" y1="88%" x2="92%" y2="90%" />
          <line x1="91%" y1="89%" x2="93%" y2="89%" />
        </g>

        {/* Sparse Ambient Micro-Particles */}
        <circle cx="22%" cy="28%" r="1" fill="#38BDF8" fillOpacity="0.4" />
        <circle cx="78%" cy="24%" r="1.2" fill="#7DD3FC" fillOpacity="0.4" />
        <circle cx="16%" cy="72%" r="1" fill="#7DD3FC" fillOpacity="0.3" />
        <circle cx="84%" cy="76%" r="1" fill="#38BDF8" fillOpacity="0.35" />
        <circle cx="50%" cy="12%" r="1.5" fill="#38BDF8" fillOpacity="0.5" />
      </svg>
    </div>
  );
}
