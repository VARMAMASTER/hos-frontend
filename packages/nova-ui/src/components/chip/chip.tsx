import type { HTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';

export type ChipTone = 'neutral' | 'good' | 'warn' | 'crit' | 'info' | 'ai';

// The word every tone is shown with, wherever a tone appears (a timeline event, a feed row, a KPI's
// sentiment). Severity is never carried by colour alone; neutral says nothing.
export const TONE_WORDS: Readonly<Record<ChipTone, string | null>> = {
  neutral: null,
  good: 'Good',
  warn: 'Warning',
  crit: 'Critical',
  info: 'Info',
  ai: 'AI',
};

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
}

const tones: Record<ChipTone, string> = {
  neutral: 'border border-border bg-surface-2 text-ink-2',
  good: 'bg-good-soft text-good-deep',
  warn: 'bg-warn-soft text-warn-deep',
  crit: 'bg-crit-soft text-crit-deep',
  info: 'bg-info-soft text-info-deep',
  ai: 'bg-ai-soft text-ai-deep',
};

export function Chip({ tone = 'neutral', className, ...rest }: ChipProps) {
  return (
    <span
      data-tone={tone}
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
