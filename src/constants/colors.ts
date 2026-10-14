// Shared design tokens for the PDF app. One light "paper" theme —
// a document reader reads best on a consistent, paper-like surface
// regardless of system dark mode, the same choice Kindle/Books apps make.
export const colors = {
  paper: '#EEF0ED',
  surface: '#FFFFFF',
  ink: '#1C2430',
  muted: '#6D7378',
  line: '#D7DAD5',
  accent: '#9B3A3A',
  accentInk: '#FFFFFF',
  danger: '#B3261E',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
