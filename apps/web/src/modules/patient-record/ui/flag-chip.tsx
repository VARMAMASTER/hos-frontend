import { Chip } from '@hos/nova-ui';
import type { Flag, FlagTone } from '../data';

const svg = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  focusable: false,
  'aria-hidden': true,
} as const;

export interface FlagGlyphProps {
  tone: FlagTone;
  className?: string;
}

// A different shape per tone, so a status survives greyscale and colour blindness: a warning
// triangle, a ringed exclamation, a tick, a ringed "i". Neutral has none. Decorative: the words
// beside it carry the meaning.
export function FlagGlyph({ tone, className }: FlagGlyphProps) {
  if (tone === 'crit') {
    return (
      <svg {...svg} className={className}>
        <path d="M10 3l7.5 13h-15z" />
        <path d="M10 8.5v3.5M10 14.25h.01" />
      </svg>
    );
  }
  if (tone === 'warn') {
    return (
      <svg {...svg} className={className}>
        <circle cx="10" cy="10" r="7.25" />
        <path d="M10 6.5v4M10 13.25h.01" />
      </svg>
    );
  }
  if (tone === 'good') {
    return (
      <svg {...svg} className={className}>
        <path d="M4.5 10.5l3.5 3.5 7.5-8" />
      </svg>
    );
  }
  if (tone === 'info') {
    return (
      <svg {...svg} className={className}>
        <circle cx="10" cy="10" r="7.25" />
        <path d="M10 9v4.5M10 6.5h.01" />
      </svg>
    );
  }
  return null;
}

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
      icon={
        flag.tone === 'neutral' ? undefined : <FlagGlyph tone={flag.tone} />
      }
      className={className}
    >
      {flag.label}
    </Chip>
  );
}
