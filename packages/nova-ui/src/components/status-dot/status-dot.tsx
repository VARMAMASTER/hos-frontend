import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import {
  StatusDotMark,
  statusDotRow,
  type StatusDotPulse,
  type StatusDotTone,
} from './status-dot-mark';

export type { StatusDotPulse, StatusDotTone };

export interface StatusDotProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  tone: StatusDotTone;
  // Mandatory: a bare coloured dot is colour-only signalling, which fails for colour-blind users
  // and in greyscale print.
  label: ReactNode;
  // A heartbeat on the dot (a soft ring that expands and fades, a two-beat lub-dub), for LIVE or
  // URGENT states only: a critical alert, a patient monitored live, an active queue. A page of
  // pulsing dots has none that stand out. The meaning is always in the label, never in the motion,
  // and under prefers-reduced-motion the dot is still. true is slow (about 1.4s); 'fast' about 0.9s.
  pulse?: StatusDotPulse;
}

export function StatusDot({
  tone,
  label,
  pulse = false,
  className,
  ...rest
}: StatusDotProps) {
  return (
    <span data-tone={tone} className={cx(statusDotRow, className)} {...rest}>
      <StatusDotMark tone={tone} pulse={pulse} />
      {label}
    </span>
  );
}
