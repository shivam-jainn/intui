/**
 * Intui Design System — Single source of truth for colors.
 *
 * Change anything here and it ripples everywhere.
 * Palette structure:
 *   - bg        → backgrounds (darkest → lightest)
 *   - surface   → cards, popups, elevated surfaces
 *   - border    → subtle dividers
 *   - text      → primary text
 *   - textDim   → secondary / muted text
 *   - primary   → main accent (teal family)
 *   - accent    → secondary accent (violet family)
 *   - danger    → errors, destructive actions
 *   - success   → confirmations
 *   - warning   → cautions
 *   - glass     → translucent overlays
 */

export const colors = {
  bg: {
    base: "#0a0a0f",
    raised: "#111118",
    overlay: "#18181f",
  },
  surface: {
    default: "#16161e",
    hover: "#1c1c26",
    active: "#22222e",
  },
  border: {
    subtle: "#1e1e2a",
    default: "#2a2a3a",
    strong: "#3a3a4e",
  },
  text: {
    primary: "#e4e4ef",
    secondary: "#8888a0",
    muted: "#55556a",
  },
  primary: {
    50: "#e6fcf5",
    100: "#c3fae8",
    200: "#96f2d7",
    300: "#63e6be",
    400: "#38d9a9",
    500: "#20c997",
    600: "#12b886",
    700: "#0ca678",
    800: "#099268",
    900: "#087f5b",
  },
  accent: {
    50: "#f3f0ff",
    100: "#e5dbff",
    200: "#d0bfff",
    300: "#b197fc",
    400: "#9775fa",
    500: "#845ef7",
    600: "#7950f2",
    700: "#7048e8",
    800: "#6741d9",
    900: "#5f3dc4",
  },
  danger: {
    50: "#fff5f5",
    100: "#ffe3e3",
    200: "#ffc9c9",
    300: "#ffa8a8",
    400: "#ff8787",
    500: "#ff6b6b",
    600: "#fa5252",
    700: "#f03e3e",
    800: "#e03131",
    900: "#c92a2a",
  },
  success: {
    50: "#ebfbee",
    100: "#d3f9d8",
    200: "#b2f2bb",
    300: "#8ce99a",
    400: "#69db7c",
    500: "#51cf66",
    600: "#40c057",
    700: "#37b24d",
    800: "#2f9e44",
    900: "#2b8a3e",
  },
  warning: {
    50: "#fff9db",
    100: "#fff3bf",
    200: "#ffec99",
    300: "#ffe066",
    400: "#ffd43b",
    500: "#fcc419",
    600: "#fab005",
    700: "#f59f00",
    800: "#f08c00",
    900: "#e67700",
  },
  glass: {
    timer: "rgba(56, 217, 169, 0.12)",
    timerBorder: "rgba(56, 217, 169, 0.30)",
    mixer: "rgba(250, 82, 82, 0.12)",
    mixerBorder: "rgba(250, 82, 82, 0.30)",
    neutral: "rgba(255, 255, 255, 0.04)",
    neutralBorder: "rgba(255, 255, 255, 0.08)",
  },
} as const;

/** Mantine theme overrides that pull from the centralized palette. */
export const mantineThemeOverrides = {
  primaryColor: "primary",
  defaultRadius: "md",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  colors: {
    primary: [
      colors.primary[50],
      colors.primary[100],
      colors.primary[200],
      colors.primary[300],
      colors.primary[400],
      colors.primary[500],
      colors.primary[600],
      colors.primary[700],
      colors.primary[800],
      colors.primary[900],
    ] as [string, string, string, string, string, string, string, string, string, string],
    accent: [
      colors.accent[50],
      colors.accent[100],
      colors.accent[200],
      colors.accent[300],
      colors.accent[400],
      colors.accent[500],
      colors.accent[600],
      colors.accent[700],
      colors.accent[800],
      colors.accent[900],
    ] as [string, string, string, string, string, string, string, string, string, string],
    dark: [
      colors.text.primary,
      colors.text.secondary,
      colors.text.muted,
      colors.border.strong,
      colors.border.default,
      colors.border.subtle,
      colors.surface.default,
      colors.bg.overlay,
      colors.bg.raised,
      colors.bg.base,
    ] as [string, string, string, string, string, string, string, string, string, string],
  },
};
