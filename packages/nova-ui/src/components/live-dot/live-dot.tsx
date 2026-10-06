import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import {
  StatusDotMark,
  statusDotRow,
  type StatusDotPulse,
  type StatusDotTone,
} from '../status-dot/status-dot-mark';

// A name is mandatory, as StatusDot's label is: a visible label, or an aria-label for a bare dot.
type LiveDotName =
  | { label: ReactNode; 'aria-label'?: string }
  | { label?: undefined; 'aria-label': string };

export type LiveDotProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'role' | 'aria-label'
> & {
  // good by default. Not an AI tone: AI output is marked by AiBadge.
  tone?: StatusDotTone;
  // The heartbeat is on by default (slow, about 1.4s); 'fast' is about 0.9s, false switches it
  // off, for a feed that has gone offline. Reduced motion always leaves it still.
  pulse?: StatusDotPulse;
} & LiveDotName;

// A standalone indicator that data is arriving live: a heartbeat dot, with an optional label such
// as "Live". It is a status region (role="status"), so a change of label is announced politely.
// Use it for live or urgent data only: one per surface, not one per row.
export function LiveDot({
  tone = 'good',
  pulse = true,
  label,
  className,
  ...rest
}: LiveDotProps) {
  return (
    <span
      role="status"
      data-tone={tone}
      className={cx(statusDotRow, className)}
      {...rest}
    >
      <StatusDotMark tone={tone} pulse={pulse} />
      {label}
    </span>
  );
}
