import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { SparkleCluster } from '../../primitives/ai-sparkle';
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
  neutral: 'size-s4 rounded-full bg-ink-3',
  good: 'size-s4 rounded-full bg-good',
  warn: 'size-s4 bg-warn [clip-path:polygon(50%_0,100%_100%,0_100%)]',
  crit: 'size-s4 rounded-none bg-crit',
  info: 'size-s4 rounded-full bg-info',
  ai: 'flex size-s4 items-center justify-center text-control leading-none text-ai',
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
        radius="card"
        className={cx(
          'px-row py-s8 text-center text-control text-ink-3',
          className,
        )}
      >
        <p>{emptyMessage}</p>
      </Surface>
    );
  }

  return (
    <Surface
      as="ol"
      material="data"
      radius="card"
      {...rest}
      className={className}
    >
      {items.map(({ id, time, title, detail, tone = 'neutral' }) => (
        <li
          key={id}
          data-tone={tone}
          // The prototype's .feed-item: 13px, a row's 10px by 16px, 12px between its parts, a hairline
          // below.
          className="flex gap-s5 border-b border-border px-row py-row-comfortable text-control last:border-b-0"
        >
          <span
            data-marker=""
            aria-hidden="true"
            className={cx('mt-s1 shrink-0', markers[tone])}
          >
            {tone === 'ai' ? (
              <span className="relative inline-flex items-center justify-center">
                <SparkleCluster size="xs" className="text-ai-bright" />
              </span>
            ) : null}
          </span>
          <span className="shrink-0 pt-s0 font-mono text-meta whitespace-nowrap text-ink-3">
            {time}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-s3 gap-y-s1 font-semibold text-ink">
              <ToneLabel tone={tone} />
              {title}
            </div>
            {detail ? (
              <div data-detail="" className="mt-s0 text-ink-2">
                {detail}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </Surface>
  );
}
