import type { ReactNode } from 'react';
import { Chip } from '@hos/nova-ui';
import type { Flag, FlagTone } from '../data';

const glyph = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  focusable: false,
  'aria-hidden': true,
} as const;

// A different shape per tone, so a status survives greyscale and colour blindness: the words are in
// the chip, and the shape says how serious they are.
const GLYPHS: Record<FlagTone, ReactNode> = {
  crit: (
    <svg {...glyph}>
      <path d="M10 3l7.5 13h-15z" />
      <path d="M10 8.5v3.5M10 14.25h.01" />
    </svg>
  ),
  warn: (
    <svg {...glyph}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6.5v4M10 13.25h.01" />
    </svg>
  ),
  good: (
    <svg {...glyph}>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  ),
  info: (
    <svg {...glyph}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 9v4.5M10 6.5h.01" />
    </svg>
  ),
  neutral: null,
};

export interface FlagChipProps {
  flag: Flag;
  className?: string;
}

// A status flag as a chip: always the words, and a shape for every tone but neutral. Never colour
// alone.
export function FlagChip({ flag, className }: FlagChipProps) {
  return (
    <Chip
      tone={flag.tone}
      icon={GLYPHS[flag.tone] ?? undefined}
      className={className}
    >
      {flag.label}
    </Chip>
  );
}
