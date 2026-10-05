// Values copied verbatim from the validated prototype (os/.../assets/hos.css).
// Tone numbers are names: lighter = lower. Components never import this file.
export const primitives = {
  white: '#FFFFFF',
  lavender: { 50: '#F8F7FD', 100: '#F0EFF9', 200: '#E4E1F2', 300: '#CFC9E6' },
  ink: { 500: '#6A6584', 600: '#5B5775', 900: '#1A1730' },
  violet: { 100: '#EFEAFC', 600: '#6D4FE0', 700: '#5636B8' },
  cyan: { 100: '#DDF4FA', 700: '#0E7490', 800: '#0B5567' },
  green: { 100: '#E3F2EC', 600: '#0B8A68', 800: '#07634B' },
  amber: { 100: '#FBEEDD', 700: '#B45309', 800: '#8A3E06' },
  red: { 100: '#F9E7E5', 700: '#B3261E', 800: '#8E1D16' },
  blue: { 100: '#E7EFF8', 700: '#2563A8', 800: '#1A4C85' },
} as const;
