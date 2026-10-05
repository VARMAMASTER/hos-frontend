import type { OlHTMLAttributes, ReactNode } from 'react';

export type ActivityTone = 'neutral' | 'good' | 'warn' | 'crit' | 'info' | 'ai';

export interface ActivityFeedItem {
  id: string;
  // Shown in the mono font. A string ("09:12 AM") or a <time> element.
  time: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  tone?: ActivityTone;
}

export interface ActivityFeedProps
  extends Omit<OlHTMLAttributes<HTMLOListElement>, 'children'> {
  items: ActivityFeedItem[];
  // Shown instead of an empty list.
  emptyMessage?: ReactNode;
}

// Tone is a marker the eye picks out, and also a word the ear hears: severity must never ride on
// colour alone. Neutral says nothing.
const toneWord: Record<ActivityTone, string | null> = {
  neutral: null,
  good: 'Good',
  warn: 'Warning',
  crit: 'Critical',
  info: 'Information',
  ai: 'AI',
};

// The shape backs the colour up for the tones that matter most: warn is a triangle, crit a square,
// everything else a circle.
const markers: Record<ActivityTone, string> = {
  neutral: 'rounded-full bg-ink-3',
  good: 'rounded-full bg-good',
  warn: 'bg-warn [clip-path:polygon(50%_0,100%_100%,0_100%)]',
  crit: 'rounded-xs bg-crit',
  info: 'rounded-full bg-info',
  ai: 'rounded-full bg-ai',
};

export function ActivityFeed({
  items,
  emptyMessage = 'No recent activity',
  className,
  ...rest
}: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <p
        className={['px-4 py-6 text-center text-sm text-ink-3', className]
          .filter(Boolean)
          .join(' ')}
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ol {...rest} className={className}>
      {items.map(({ id, time, title, detail, tone = 'neutral' }) => (
        <li
          key={id}
          data-tone={tone}
          className="flex gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
        >
          <span
            data-marker=""
            aria-hidden="true"
            className={`mt-1.5 size-2.5 shrink-0 ${markers[tone]}`}
          />
          <span className="shrink-0 pt-0.5 font-mono text-xs whitespace-nowrap text-ink-3">
            {time}
          </span>
          <div className="min-w-0">
            <div className="font-medium text-ink">
              {toneWord[tone] ? (
                <>
                  <span className="sr-only">{toneWord[tone]}:</span>{' '}
                </>
              ) : null}
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
    </ol>
  );
}
