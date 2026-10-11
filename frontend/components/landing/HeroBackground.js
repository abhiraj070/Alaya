export default function HeroBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Technical Low-Contrast Grid Layer */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_30%,transparent_100%)]" />

      {/* 2. Top-Origin Atmospheric Radial Glow (Sky Blue) */}
      <div
        className="absolute -top-32 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(125, 211, 252, 0.08) 45%, transparent 70%)",
        }}
      />

      {/* 3. Subtle Ambient Floating Glow Regions */}
      <div
        className="animate-float-gentle absolute top-1/4 -left-20 h-72 w-72 rounded-full opacity-20 blur-[100px]"
        style={{
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, transparent 70%)",
          animationDuration: "14s",
        }}
      />
      <div
        className="animate-float-gentle absolute top-1/3 -right-20 h-80 w-80 rounded-full opacity-20 blur-[100px]"
        style={{
          background: "radial-gradient(circle, rgba(125, 211, 252, 0.25) 0%, transparent 70%)",
          animationDuration: "18s",
          animationDelay: "-6s",
        }}
      />

      {/* 4. Fine Technical Line Vectors & Sparse Particles via SVG */}
      <svg
        className="absolute inset-0 h-full w-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="grid-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0)" />
            <stop offset="50%" stopColor="rgba(56, 189, 248, 0.15)" />
            <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
          </linearGradient>
          <radialGradient id="particle-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Delicate Diagonal Alignment Rays */}
        <line
          x1="10%"
          y1="0"
          x2="45%"
          y2="100%"
          stroke="url(#grid-line-grad)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <line
          x1="90%"
          y1="0"
          x2="55%"
          y2="100%"
          stroke="url(#grid-line-grad)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />

        {/* Sparse Ambient Particles with Subtle Pulsing */}
        <circle cx="18%" cy="22%" r="1.5" fill="#38BDF8" fillOpacity="0.5" className="animate-pulse" />
        <circle cx="28%" cy="65%" r="1" fill="#7DD3FC" fillOpacity="0.4" />
        <circle cx="42%" cy="18%" r="1.5" fill="#38BDF8" fillOpacity="0.6" className="animate-pulse" />
        <circle cx="75%" cy="28%" r="1.5" fill="#7DD3FC" fillOpacity="0.5" className="animate-pulse" />
        <circle cx="82%" cy="72%" r="1" fill="#38BDF8" fillOpacity="0.4" />
        <circle cx="62%" cy="85%" r="1.5" fill="#7DD3FC" fillOpacity="0.6" className="animate-pulse" />
        <circle cx="88%" cy="42%" r="1.2" fill="#38BDF8" fillOpacity="0.3" />
        <circle cx="12%" cy="78%" r="1" fill="#7DD3FC" fillOpacity="0.4" />
      </svg>
    </div>
  );
}
