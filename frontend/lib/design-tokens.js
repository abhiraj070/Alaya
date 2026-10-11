/**
 * Alaya Design System Tokens
 * Theme: Black & Sky Blue (Futuristic, Minimal, Premium, Technically Sophisticated)
 */

export const colors = {
  bg: {
    primary: "#050505",
    secondary: "#0B0D0F",
  },
  surface: {
    primary: "#0D1014",
    secondary: "#11161B",
    tertiary: "#161C23",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.08)",
    strong: "rgba(255, 255, 255, 0.14)",
    accent: "rgba(56, 189, 248, 0.3)",
  },
  text: {
    primary: "#F5F7FA",
    secondary: "#A1AAB5",
    muted: "#737D89",
  },
  accent: {
    sky: "#38BDF8",
    skyLight: "#7DD3FC",
    skyGlow: "rgba(56, 189, 248, 0.12)",
  },
  status: {
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
  },
};

export const typography = {
  hero: "heading-hero",
  section: "heading-section",
  subsection: "heading-subsection",
  body: "text-body",
  description: "text-description",
  labelCaps: "label-caps",
  labelForm: "label-form",
};

export const layout = {
  containerPage: "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  containerContent: "w-full max-w-5xl mx-auto px-4 sm:px-6",
  containerNarrow: "w-full max-w-3xl mx-auto px-4 sm:px-6",
  sectionSpacing: "py-16 md:py-24",
  componentGap: "gap-4 md:gap-6",
};

export const surfaces = {
  card: "surface-card p-5 md:p-6",
  cardInteractive: "surface-card-interactive p-5 md:p-6",
  panel: "surface-panel p-4 md:p-5",
  elevated: "surface-elevated p-4",
};

export const controls = {
  input: "input-field w-full",
  buttonPrimary: "btn-primary",
  buttonSecondary: "btn-secondary",
  buttonGhost: "btn-ghost",
};

export const motion = {
  fast: "150ms",
  standard: "250ms",
  large: "350ms",
  transitionFast: "transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]",
  transitionStandard: "transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]",
};
