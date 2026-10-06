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

const markers: Record<ChipTone, string> = {
  neutral: 'bg-ink-3',
  good: 'bg-good',
  warn: 'bg-warn',
  crit: 'bg-crit',
  info: 'bg-info',
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
          <li key={item.id} className="flex gap-4">
            <div
              aria-hidden="true"
              className="flex w-5 shrink-0 flex-col items-center"
            >
              {/* h-4 is the height of the time line, so the marker centres on it. */}
              <span className="flex h-4 items-center">
                <span
                  data-marker=""
                  data-tone={tone}
                  className={cx(
                    'flex shrink-0 items-center justify-center rounded-full [corner-shape:round]',
                    // AI is never marked by colour alone: its marker carries the spark too.
                    tone === 'ai'
                      ? 'size-5 text-caption leading-none text-on-primary'
                      : 'size-3',
                    markers[tone],
                  )}
                >
                  {tone === 'ai' ? '✦' : null}
                </span>
              </span>
              {last ? null : (
                <span
                  data-connector=""
                  className="mt-1 w-px flex-1 bg-border-strong"
                />
              )}
            </div>
            <div className={last ? 'min-w-0 flex-1' : 'min-w-0 flex-1 pb-6'}>
              <div className="text-caption text-ink-3">{item.time}</div>
              {/* The tone is a visible word (or the AI badge) before the title, so a critical event
                  and a good one differ in greyscale and are announced differently. */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-callout font-semibold text-ink">
                <ToneLabel tone={tone} />
                {item.title}
              </div>
              {item.description ? (
                <div className="mt-1 text-callout text-ink-2">
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
