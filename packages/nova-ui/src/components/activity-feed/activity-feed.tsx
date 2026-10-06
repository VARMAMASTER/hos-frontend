import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { Surface } from '../../primitives/surface';
import type { ChipTone } from '../chip/chip';
import { ToneLabel } from '../chip/tone-label';

// The Chip tones: one set of tones, one set of words (TONE_WORDS), everywhere.
export type ActivityTone = ChipTone;

export interface ActivityFeedItem {
  id: string;
  // Shown in the mono font. A string ("09:12 AM") or a <time> element.
  time: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  tone?: ActivityTone;
}

export interface ActivityFeedProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  items: ActivityFeedItem[];
  // Shown instead of an empty list.
  emptyMessage?: ReactNode;
}

// Tone is a visible word (ToneLabel) before the title, and a marker the eye picks out. The marker's
// shape backs the colour up: warn is a triangle, crit a square, AI the spark, the rest a circle.
const markers: Record<ActivityTone, string> = {
  neutral: 'size-2.5 rounded-full bg-ink-3',
  good: 'size-2.5 rounded-full bg-good',
  warn: 'size-2.5 bg-warn [clip-path:polygon(50%_0,100%_100%,0_100%)]',
  crit: 'size-2.5 rounded-xs bg-crit',
  info: 'size-2.5 rounded-full bg-info',
  ai: 'flex size-2.5 items-center justify-center text-xs leading-none text-ai',
};

// The feed is its own panel on the opaque data surface: events are clinical records (an alarm, a
// transfer), and translucency would cost legibility. Do not nest it in a Card body.
export function ActivityFeed({
  items,
  emptyMessage = 'No recent activity',
  className,
  ...rest
}: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <Surface
        material="data"
        className={cx('px-4 py-6 text-center text-sm text-ink-3', className)}
      >
        <p>{emptyMessage}</p>
      </Surface>
    );
  }

  return (
    <Surface as="ol" material="data" {...rest} className={className}>
      {items.map(({ id, time, title, detail, tone = 'neutral' }) => (
        <li
          key={id}
          data-tone={tone}
          className="flex gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
        >
          <span
            data-marker=""
            aria-hidden="true"
            className={cx('mt-1.5 shrink-0', markers[tone])}
          >
            {tone === 'ai' ? '✦' : null}
          </span>
          <span className="shrink-0 pt-0.5 font-mono text-xs whitespace-nowrap text-ink-3">
            {time}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-ink">
              <ToneLabel tone={tone} />
              {title}
            </div>
            {detail ? (
              <div data-detail="" className="mt-0.5 text-ink-2">
                {detail}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </Surface>
  );
}
