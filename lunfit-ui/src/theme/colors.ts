/**
 * Colour tokens ported from the LunFit Figma Make prototype
 * (src/styles/theme.css — the `.dark` block, which is the only theme the
 * design ships). Hex values are copied verbatim; do not eyeball-adjust them.
 */
export const colors = {
  // Surfaces, darkest to lightest
  background: '#0b0b10',
  chrome: '#0e0e16', // header, tab bar, login side panel
  card: '#111118',
  popover: '#16161f',
  secondary: '#1a1a26',
  muted: '#1e1e2c',
  switchTrack: '#2a2a38',

  // Text
  foreground: '#eeeef5',
  mutedForeground: '#8888a0',

  // Brand
  primary: '#c8ff00',
  primaryForeground: '#0b0b10',
  destructive: '#ff4466',
  destructiveForeground: '#ffffff',
  ring: '#c8ff00',

  // Hairlines. RN has no `currentColor`, so these are pre-composited over
  // `background` rather than left as rgba where a solid fill reads better.
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',

  // Data-viz ramp (--chart-1..5)
  chart: ['#c8ff00', '#00d4ff', '#ff6b35', '#a855f7', '#f59e0b'] as const,

  /** Map canvas in the Track view — flat fills, not part of the semantic ramp. */
  map: {
    canvas: '#0f1117',
    building: '#141620',
    road: '#1e2130',
    roadCenterline: '#252840',
    routeStart: '#00d4ff',
    routeLine: '#c8ff00',
    dotCore: '#0b0b10',
  },
} as const;

/** Run-type accents, keyed to the `type` field on a run record. */
export const runTypeColors = {
  easy: '#00d4ff',
  long: '#c8ff00',
  tempo: '#ff6b35',
  base: '#a855f7',
} as const;

export type RunType = keyof typeof runTypeColors;

/**
 * The design leans on Tailwind's `/10`, `/20`, `/30` alpha suffixes for badge
 * fills and borders. RN needs literal colours, so compose them here.
 */
export function alpha(hex: string, opacity: number): string {
  const v = hex.replace('#', '');
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
