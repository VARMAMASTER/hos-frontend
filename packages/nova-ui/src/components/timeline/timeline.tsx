import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import type { ChipTone } from '../chip/chip';
import { ToneLabel } from '../chip/tone-label';

export interface TimelineItem {
  id: string;
  // Rendered as given. Pass a <time dateTime="..."> when the value should be machine-readable.
  time: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  tone?: ChipTone;
}

export interface TimelineProps
  extends Omit<HTMLAttributes<HTMLOListElement>, 'children'> {
  // Shown in the order given. The caller owns the order, which is the point of an event history.
  items: TimelineItem[];
}

// The prototype's .tl-item marker: a 10px ring, 2.5px thick, on the panel. Neutral is the brand ring
// the prototype draws; the status tones ring in their own colour. AI is the AI fill with the spark.
const markers: Record<ChipTone, string> = {
  neutral: 'border-primary',
  good: 'border-good',
  warn: 'border-warn',
  crit: 'border-crit',
  info: 'border-info',
  ai: 'bg-ai',
};

export function Timeline({ items, ...rest }: TimelineProps) {
  return (
    // Tailwind's reset sets list-style: none, which can make Safari with VoiceOver drop the list
    // semantics of a bare <ol>. Stating the role keeps "list, n items" announced for an event
    // history, where hearing how many events there are matters.
    // eslint-disable-next-line jsx-a11y/no-redundant-roles
    <ol role="list" {...rest}>
      {items.map((item, index) => {
        const tone = item.tone ?? 'neutral';
        const last = index === items.length - 1;
        return (
          <li key={item.id} className="flex gap-3">
            <div
              aria-hidden="true"
              className="flex w-3 shrink-0 flex-col items-start"
            >
              {/* The prototype sets the ring 5px down, level with the date line. */}
              <span className="relative top-[5px] flex items-center">
                <span
                  data-marker=""
                  data-tone={tone}
                  className={cx(
                    'flex shrink-0 items-center justify-center rounded-full',
                    // AI is never marked by colour alone: its marker carries the spark too.
                    tone === 'ai'
                      ? 'size-4 text-[10px] leading-none text-on-primary'
                      : 'size-2.5 border-[2.5px] bg-surface',
                    markers[tone],
                  )}
                >
                  {tone === 'ai' ? '✦' : null}
                </span>
              </span>
              {last ? null : (
                <span
                  data-connector=""
                  className="relative top-1.5 mt-1 w-0.5 flex-1 rounded-full bg-border-strong"
                />
              )}
            </div>
            <div className={last ? 'min-w-0 flex-1' : 'min-w-0 flex-1 pb-4'}>
              {/* .tl-date: 11px semibold small print, tracked .04em in capitals. */}
              <div className="text-[11px] font-semibold uppercase tracking-[.04em] text-ink-3">
                {item.time}
              </div>
              {/* The tone is a visible word (or the AI badge) before the title, so a critical event
                  and a good one differ in greyscale and are announced differently. */}
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-semibold text-ink">
                <ToneLabel tone={tone} />
                {item.title}
              </div>
              {item.description ? (
                <div className="mt-0.5 text-[13px] text-ink-2">
                  {item.description}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
