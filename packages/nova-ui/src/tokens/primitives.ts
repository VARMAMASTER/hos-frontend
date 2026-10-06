// Values copied verbatim from the HOS prototype (os/public/assets/hos.css), except where noted.
// Tone numbers are names: lighter = lower. Components never import this file.
export const primitives = {
  white: '#FFFFFF',
  lavender: { 50: '#F8F7FD', 100: '#F0EFF9', 200: '#E4E1F2', 300: '#CFC9E6' },
  // ink 500 was the prototype's #6A6584; it is darkened so small text holds 4.5:1 on the aurora-tinted
  // canvas (material.spec.ts). ink 400 is the 3:1 control edge (the prototype has no such token).
  ink: { 400: '#736E8B', 500: '#5D5974', 600: '#5B5775', 900: '#1A1730' },
  violet: { 50: '#F8F5FE', 100: '#EFEAFC', 600: '#6D4FE0', 700: '#5636B8' },
  cyan: {
    50: '#F6FDFF',
    100: '#DDF4FA',
    200: '#B9E6F2',
    400: '#22D3EE',
    700: '#0E7490',
    800: '#0B5567',
  },
  green: { 100: '#E3F2EC', 600: '#0B8A68', 800: '#07634B' },
  amber: { 100: '#FBEEDD', 700: '#B45309', 800: '#8A3E06' },
  red: { 100: '#F9E7E5', 700: '#B3261E', 800: '#8E1D16' },
  blue: { 100: '#E7EFF8', 700: '#2563A8', 800: '#1A4C85' },
  // The deep indigo-violet chrome (--chrome-1, -2, -3, --chrome-ink, --chrome-accent, --chrome-glow-2).
  chrome: {
    1: '#170F30',
    2: '#2A1B5C',
    3: '#3B2178',
    ink: '#F1EEFB',
    accent: '#A78BFA',
    glow2: '#60A5FA',
    // The ring that cuts a badge out of the top bar (.tb-ico .tb-dot), a literal in the prototype.
    ring: '#221448',
    // The sidebar's base, deepening downward (.sidebar's linear-gradient stops, literals in the
    // prototype).
    sidebar: { 1: '#26185A', 2: '#1A0F42', 3: '#150C34' },
  },
  // The data palette (see --nova-chart-* in semantic.ts): sky, gold, rose, olive, lavender, plum.
  data: {
    sky: '#248FCC',
    gold: '#B38A00',
    rose: '#E75594',
    olive: '#6C6610',
    lavender: '#A779FD',
    plum: '#9C1B80',
  },
} as const;
