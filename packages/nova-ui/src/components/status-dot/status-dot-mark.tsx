import { cx } from '../../primitives/cx';

// No `ai` tone: AI output is marked by AiBadge (a spark and a text label), never by a bare dot.
export type StatusDotTone = 'good' | 'warn' | 'crit' | 'info' | 'neutral';

// false (or omitted) is a still dot. true is the slow heartbeat (about 1.4s); 'fast' is about 0.9s.
export type StatusDotPulse = boolean | 'slow' | 'fast';

const dots: Record<StatusDotTone, string> = {
  good: 'bg-good',
  warn: 'bg-warn',
  crit: 'bg-crit',
  info: 'bg-info',
  neutral: 'bg-ink-3',
};

// The ring is the tone colour at low alpha, so it follows every theme and scheme.
const rings: Record<StatusDotTone, string> = {
  good: 'bg-good/40',
  warn: 'bg-warn/40',
  crit: 'bg-crit/40',
  info: 'bg-info/40',
  neutral: 'bg-ink-3/40',
};

// The dot and its label sit on one line, shared by StatusDot and LiveDot.
export const statusDotRow =
  'inline-flex items-center gap-1.5 text-[13px] text-ink';

// The heartbeat is decoration, never the message: both animations are motion-safe, and the ring is
// not rendered to the eye at all (hidden) unless motion is allowed, so a reduced-motion user sees a
// plain dot. The ring sits inside the dot and is hidden from assistive technology like it.
export function StatusDotMark({
  tone,
  pulse = false,
}: {
  tone: StatusDotTone;
  pulse?: StatusDotPulse;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'relative size-[7px] shrink-0 rounded-full',
        dots[tone],
        pulse &&
          cx(
            'motion-safe:animate-heartbeat',
            pulse === 'fast' ? 'pulse-fast' : 'pulse-slow',
          ),
      )}
    >
      {pulse ? (
        <span
          aria-hidden="true"
          className={cx(
            'absolute inset-0 hidden rounded-full motion-safe:block motion-safe:animate-pulse-ring',
            rings[tone],
          )}
        />
      ) : null}
    </span>
  );
}
