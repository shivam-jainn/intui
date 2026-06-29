export const t = {
  // Colors
  accent: "#60a5fa",
  accentHover: "#93bbfc",
  accentMuted: "rgba(96,165,250,0.08)",
  accentBorder: "rgba(96,165,250,0.2)",
  accentGlow: "rgba(96,165,250,0.15)",

  success: "#4ade80",
  successMuted: "rgba(34,197,94,0.06)",
  successBorder: "rgba(34,197,94,0.15)",

  error: "#ef4444",
  errorHover: "#f87171",
  errorMuted: "rgba(239,68,68,0.06)",
  errorBorder: "rgba(239,68,68,0.15)",

  warning: "#f59e0b",
  warningMuted: "rgba(245,158,11,0.06)",
  warningBorder: "rgba(245,158,11,0.15)",

  orange: "#fb923c",

  // Backgrounds
  bgRoot: "#070b14",
  bgPanel: "rgba(10,15,30,0.95)",
  bgPanelHover: "rgba(14,20,38,0.98)",
  bgSurface: "rgba(255,255,255,0.02)",
  bgSurfaceHover: "rgba(255,255,255,0.04)",
  bgSurfaceActive: "rgba(255,255,255,0.06)",
  bgOverlay: "rgba(7,11,20,0.85)",
  bgCode: "rgba(0,0,0,0.3)",

  // Text
  textPrimary: "rgba(255,255,255,0.92)",
  textSecondary: "rgba(255,255,255,0.6)",
  textMuted: "rgba(255,255,255,0.4)",
  textDim: "rgba(255,255,255,0.25)",
  textFaint: "rgba(255,255,255,0.15)",

  // Borders
  border: "rgba(255,255,255,0.06)",
  borderSubtle: "rgba(255,255,255,0.04)",
  borderHover: "rgba(255,255,255,0.1)",
  borderActive: "rgba(96,165,250,0.3)",
  divider: "rgba(255,255,255,0.06)",

  // Spacing
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    "2xl": 32,
  },

  // Radii
  radius: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    "2xl": 16,
    full: 999,
  },

  // Font
  font: {
    mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    sans: "Inter, ui-sans-serif, system-ui, sans-serif",
  },

  // Font sizes
  size: {
    xs: 10,
    sm: 11,
    md: 12,
    base: 13,
    lg: 14,
    xl: 16,
    "2xl": 20,
    "3xl": 28,
  },

  // Transitions
  transition: {
    fast: "100ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "400ms cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  // Shadows
  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.3)",
    md: "0 4px 12px rgba(0,0,0,0.4)",
    lg: "0 8px 32px rgba(0,0,0,0.5)",
    glow: (color: string, opacity = 0.15) =>
      `0 0 20px ${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`,
  },

  // Z-index layers
  z: {
    base: 0,
    panel: 10,
    handle: 20,
    sidebar: 30,
    dropdown: 40,
    overlay: 50,
    modal: 100,
    toast: 200,
  },

  // Panel dimensions
  sidebar: {
    fileTreeWidth: 260,
    aiPanelWidth: 340,
    minPanelWidth: 180,
    maxPanelWidth: 500,
    topBarHeight: 52,
    statusBarHeight: 32,
    tabHeight: 36,
  },
} as const;

// Legacy compatibility — maps old theme keys to new ones
export const incidentTheme = {
  border: `1px solid ${t.border}`,
  borderSubtle: `1px solid ${t.borderSubtle}`,
  panelBg: t.bgPanel,
  panelBgDark: t.bgPanel,
  panelBgDarker: t.bgPanel,
  textPrimary: t.textPrimary,
  textSecondary: t.textSecondary,
  textMuted: t.textMuted,
  textFaint: t.textDim,
  textDim: t.textFaint,
  accent: t.accent,
  accentBg: t.accentMuted,
  accentBorder: t.accentBorder,
  success: t.success,
  successBg: t.successMuted,
  successBorder: t.successBorder,
  error: t.error,
  errorBg: t.errorMuted,
  errorBorder: t.errorBorder,
  monoFont: t.font.mono,
  divider: t.divider,
};
