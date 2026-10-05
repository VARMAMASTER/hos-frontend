import type { HTMLAttributes, ReactNode } from 'react';

// No `ai` tone: AI output is marked by AiBadge (a spark and a text label), never by a bare dot.
export type StatusDotTone = 'good' | 'warn' | 'crit' | 'info' | 'neutral';

export interface StatusDotProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  tone: StatusDotTone;
  // Mandatory: a bare coloured dot is colour-only signalling, which fails for colour-blind users
  // and in greyscale print.
  label: ReactNode;
}

const dots: Record<StatusDotTone, string> = {
  good: 'bg-good',
  warn: 'bg-warn',
  crit: 'bg-crit',
  info: 'bg-info',
  neutral: 'bg-ink-3',
};

export function StatusDot({ tone, label, className, ...rest }: StatusDotProps) {
  return (
    <span
      data-tone={tone}
      className={['inline-flex items-center gap-2 text-sm text-ink', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={['size-2 shrink-0 rounded-full', dots[tone]].join(' ')}
      />
      {label}
    </span>
  );
}
