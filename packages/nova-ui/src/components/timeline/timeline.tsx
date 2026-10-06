import {
  useId,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { Avatar } from '../avatar/avatar';
import type { ChipTone } from '../chip/chip';
import { ToneLabel } from '../chip/tone-label';
import { EmptyState } from '../empty-state/empty-state';
import {
  formatRelative,
  makeClock,
  toDate,
  type TimelineClock,
  type TimelineInstant,
} from './timeline-time';

export type { TimelineInstant } from './timeline-time';

export type TimelineDensity = 'comfortable' | 'compact';

export interface TimelineActor {
  name: string;
  // "Consultant", "Night nurse", "System".
  role?: ReactNode;
  // A photo for the avatar. Giving one also shows the avatar.
  src?: string;
  // Show the avatar (initials when there is no photo). Off by default: a dense audit log reads
  // better as text.
  avatar?: boolean;
}

export interface TimelineItem {
  id: string;
  // When it happened. With it, the event shows a relative ("2 h ago") and an absolute ("14:05") time
  // inside a <time dateTime>, and groupByDay can place it under its day.
  at?: TimelineInstant;
  // Rendered as given, in place of the time derived from `at` (which still supplies the dateTime).
  // Pass a <time dateTime="..."> here when there is no `at` and the value should be machine-readable.
  time?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  tone?: ChipTone;
  // The glyph inside the node, in place of the tone's own (a check, a cross, an exclamation mark, an
  // "i", a dot, or the AI spark). An svg, sized to the node.
  icon?: ReactNode;
  actor?: TimelineActor;
  // What opens under the event on a "Details" disclosure button.
  details?: ReactNode;
  defaultExpanded?: boolean;
}

export interface TimelineProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  // Shown in the order given. The caller owns the order, which is the point of an event history.
  items: TimelineItem[];
  // Heads each run of events from the same day ("Today", "Yesterday", "3 Oct 2026"). Needs `at`;
  // an event without one stays in the day before it.
  groupByDay?: boolean;
  // The moment "ago" is measured from. Defaults to when the timeline first renders; pass one to
  // keep a story or a test deterministic.
  now?: TimelineInstant;
  // The IANA zone the clock and the day boundaries are read in ("Asia/Kolkata"). Defaults to the
  // machine's.
  timeZone?: string;
  density?: TimelineDensity;
  // Heading level of the day headings: 3 by default, since a timeline normally sits in a section
  // that has its own heading.
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  // A skeleton in place of the events, while they load.
  loading?: boolean;
  loadingLabel?: string;
  skeletonCount?: number;
  // What shows when there are no events. A default message when left off.
  empty?: ReactNode;
}

// The node: the prototype's .tl-item ring, grown to hold a glyph. Tone-coloured, with the soft fill
// and deep ink pairs the chips use, and a glyph shape of its own per tone, so a status is never
// carried by colour alone (the tone word beside the title says the same in text).
const nodeTones: Record<Exclude<ChipTone, 'ai'>, string> = {
  neutral: 'border border-border-strong bg-surface text-ink-2',
  good: 'border border-good bg-good-soft text-good-deep',
  warn: 'border border-warn bg-warn-soft text-warn-deep',
  crit: 'border border-crit bg-crit-soft text-crit-deep',
  info: 'border border-info bg-info-soft text-info-deep',
};

const nodeSizes: Record<TimelineDensity, string> = {
  comfortable: 'size-6 [&_svg]:size-3.5',
  compact: 'size-5 [&_svg]:size-3',
};

type GlyphName = 'dot' | 'check' | 'alert' | 'cross' | 'info';

const glyphs: Record<Exclude<ChipTone, 'ai'>, GlyphName> = {
  neutral: 'dot',
  good: 'check',
  warn: 'alert',
  crit: 'cross',
  info: 'info',
};

function Glyph({ name }: { name: GlyphName }) {
  return (
    <svg
      data-glyph={name}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === 'dot' ? (
        <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
      ) : null}
      {name === 'check' ? <path d="M3.5 8.5l3 3 6-7" /> : null}
      {name === 'alert' ? <path d="M8 3.5v5.5M8 12.2v.3" /> : null}
      {name === 'cross' ? <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" /> : null}
      {name === 'info' ? <path d="M8 7.2v5M8 3.9v.3" /> : null}
    </svg>
  );
}

// The rail runs down the left of the events, one segment per row, joined end to end (each row pads
// itself at the bottom rather than leaving a margin, so the line is unbroken, across day headings
// too). The first node starts it, at the node's centre; the last node ends it, so it never trails
// off below the last event.
type Rail = 'from-node' | 'full' | 'to-node';

const rails: Record<TimelineDensity, Record<Rail, string>> = {
  comfortable: {
    'from-node': 'top-3 bottom-0',
    full: 'inset-y-0',
    'to-node': 'top-0 h-3',
  },
  compact: {
    'from-node': 'top-2.5 bottom-0',
    full: 'inset-y-0',
    'to-node': 'top-0 h-2.5',
  },
};

const railPosition: Record<TimelineDensity, string> = {
  comfortable: 'left-3',
  compact: 'left-2.5',
};

function RailLine({
  rail,
  density,
  classes,
}: {
  rail: Rail;
  density: TimelineDensity;
  classes?: string;
}) {
  return (
    <span
      data-connector={rail}
      aria-hidden="true"
      className={cx(
        'absolute w-0.5 -translate-x-1/2 rounded-full bg-border-strong',
        railPosition[density],
        classes ?? rails[density][rail],
      )}
    />
  );
}

// What the time row says: the explicit `time`, else the relative and absolute times of `at`.
function TimeRow({
  item,
  clock,
  now,
  grouped,
}: {
  item: TimelineItem;
  clock: TimelineClock;
  now: Date;
  grouped: boolean;
}) {
  const at = toDate(item.at);
  if (item.time !== undefined && at === null) {
    // The prototype's .tl-date: small print in capitals, tracked.
    return (
      <div className="text-[11px] font-semibold uppercase tracking-[.04em] text-ink-3">
        {item.time}
      </div>
    );
  }
  if (at === null) return null;
  const relative = formatRelative(at, now);
  return (
    <div className="text-[11px] font-semibold text-ink-3">
      <time dateTime={at.toISOString()}>
        {item.time !== undefined ? (
          item.time
        ) : (
          <>
            {relative ? (
              <>
                <span>{relative}</span>
                <span aria-hidden="true"> · </span>
              </>
            ) : null}
            <span className="font-mono font-medium">
              {clock.absolute(at, now, grouped)}
            </span>
          </>
        )}
      </time>
    </div>
  );
}

function Actor({ actor }: { actor: TimelineActor }) {
  const showAvatar = actor.avatar === true || actor.src !== undefined;
  return (
    <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-3">
      {showAvatar ? (
        // The name is in the text beside it; the avatar is only for the eye.
        <span aria-hidden="true" className="inline-flex">
          <Avatar name={actor.name} src={actor.src} size="xs" />
        </span>
      ) : null}
      <span className="font-semibold text-ink-2">{actor.name}</span>
      {actor.role ? <span>{actor.role}</span> : null}
    </div>
  );
}

function Event({
  item,
  rail,
  last,
  density,
  clock,
  now,
  grouped,
}: {
  item: TimelineItem;
  rail: Rail | null;
  last: boolean;
  density: TimelineDensity;
  clock: TimelineClock;
  now: Date;
  grouped: boolean;
}) {
  const tone = item.tone ?? 'neutral';
  const compact = density === 'compact';
  const titleId = useId();
  const buttonId = useId();
  const regionId = useId();
  const [expanded, setExpanded] = useState(item.defaultExpanded ?? false);
  const hasDetails = item.details !== undefined && item.details !== null;

  return (
    <li
      className={cx(
        'relative flex',
        compact ? 'gap-2.5' : 'gap-3',
        last ? null : compact ? 'pb-3' : 'pb-5',
      )}
    >
      {rail ? <RailLine rail={rail} density={density} /> : null}
      <div
        aria-hidden="true"
        className={cx(
          'relative z-10 flex shrink-0 justify-center',
          compact ? 'w-5' : 'w-6',
        )}
      >
        <span
          data-marker=""
          data-tone={tone}
          className={cx(
            'flex shrink-0 items-center justify-center rounded-full',
            nodeSizes[density],
            tone === 'ai'
              ? cx(
                  // AI is never marked by colour alone: its node carries the spark.
                  'nova-ai-grad leading-none text-on-primary',
                  compact ? 'text-[10px]' : 'text-[12px]',
                )
              : nodeTones[tone],
          )}
        >
          {item.icon ?? (tone === 'ai' ? '✦' : <Glyph name={glyphs[tone]} />)}
        </span>
      </div>
      <div className={cx('min-w-0 flex-1', compact ? 'pt-0' : 'pt-0.5')}>
        <TimeRow item={item} clock={clock} now={now} grouped={grouped} />
        {/* The tone is a visible word (or the AI badge) before the title, so a critical event and
            a good one differ in greyscale and are announced differently. */}
        <div
          className={cx(
            'mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-ink',
            compact ? 'text-[13px]' : 'text-[14px]',
          )}
        >
          <ToneLabel tone={tone} />
          <span id={titleId}>{item.title}</span>
        </div>
        {item.description ? (
          <div
            className={cx(
              'mt-0.5 text-ink-2',
              compact ? 'text-[12.5px]' : 'text-[13px]',
            )}
          >
            {item.description}
          </div>
        ) : null}
        {item.actor ? <Actor actor={item.actor} /> : null}
        {hasDetails ? (
          <>
            <button
              id={buttonId}
              type="button"
              aria-expanded={expanded}
              aria-controls={regionId}
              aria-describedby={titleId}
              onClick={() => setExpanded(!expanded)}
              className={cx(
                'mt-1 inline-flex items-center gap-1 rounded-sm text-[12px] font-semibold text-primary-strong hover:underline',
                focusRing,
              )}
            >
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 16 16"
                className={cx(
                  'size-3 transition-transform duration-150 motion-reduce:transition-none',
                  expanded && 'rotate-90',
                )}
              >
                <path
                  d="M6 3.5l4.5 4.5L6 12.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Details
            </button>
            {/* Always in the page, so aria-controls has something to point at; hidden, and empty,
                until opened. */}
            <div
              id={regionId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!expanded}
              className="mt-2 rounded-md border border-border bg-surface-2 p-3 text-[13px] text-ink-2"
            >
              {expanded ? item.details : null}
            </div>
          </>
        ) : null}
      </div>
    </li>
  );
}

function DayHeader({
  label,
  level,
  rail,
  density,
}: {
  label: string;
  level: number;
  rail: Rail;
  density: TimelineDensity;
}) {
  const Heading = `h${level}` as 'h3';
  const compact = density === 'compact';
  return (
    <Heading
      data-day-header=""
      className={cx(
        'relative flex items-center pb-2',
        compact ? 'gap-2.5' : 'gap-3',
      )}
    >
      {/* The heading's own stretch of the rail, with a small marker on it. The first heading starts
          the line at its marker. */}
      <RailLine
        rail={rail}
        density={density}
        classes={rail === 'from-node' ? 'top-1/2 bottom-0' : 'inset-y-0'}
      />
      <span
        aria-hidden="true"
        className={cx(
          'relative z-10 flex shrink-0 justify-center',
          compact ? 'w-5' : 'w-6',
        )}
      >
        <span className="size-2 rounded-full bg-border-strong" />
      </span>
      <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11.5px] font-semibold text-ink-2">
        {label}
      </span>
    </Heading>
  );
}

function Skeleton({
  count,
  label,
  density,
  rest,
}: {
  count: number;
  label: string;
  density: TimelineDensity;
  rest: HTMLAttributes<HTMLElement>;
}) {
  const compact = density === 'compact';
  // Plain shapes standing where the events will be; the pulse is for people who allow motion.
  const bar = 'motion-safe:animate-pulse rounded-full bg-border';
  return (
    <div {...rest} role="status" aria-busy="true" data-density={density}>
      <VisuallyHidden>{label}</VisuallyHidden>
      <div aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            data-skeleton-row=""
            className={cx(
              'relative flex',
              compact ? 'gap-2.5' : 'gap-3',
              index === count - 1 ? null : compact ? 'pb-3' : 'pb-5',
            )}
          >
            {count > 1 ? (
              <RailLine
                rail={
                  index === 0
                    ? 'from-node'
                    : index === count - 1
                      ? 'to-node'
                      : 'full'
                }
                density={density}
              />
            ) : null}
            <div
              className={cx(
                'relative z-10 flex shrink-0 justify-center',
                compact ? 'w-5' : 'w-6',
              )}
            >
              <span
                data-skeleton=""
                className={cx(bar, compact ? 'size-5' : 'size-6')}
              />
            </div>
            <div className="flex-1 space-y-1.5 pt-1">
              <span data-skeleton="" className={cx(bar, 'block h-2.5 w-16')} />
              <span data-skeleton="" className={cx(bar, 'block h-3 w-2/3')} />
              <span data-skeleton="" className={cx(bar, 'block h-2.5 w-1/2')} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Day {
  key: string;
  label: string | null;
  events: { item: TimelineItem; index: number }[];
}

export function Timeline({
  items,
  groupByDay = false,
  now: nowProp,
  timeZone,
  density = 'comfortable',
  headingLevel = 3,
  loading = false,
  loadingLabel = 'Loading events',
  skeletonCount = 3,
  empty,
  ...rest
}: TimelineProps) {
  // Fixed when the timeline first renders, so a re-render does not shift every "2 h ago".
  const [mountedAt] = useState(() => Date.now());
  const now = toDate(nowProp) ?? new Date(mountedAt);
  const clock = useMemo(() => makeClock(timeZone), [timeZone]);

  if (loading) {
    return (
      <Skeleton
        count={skeletonCount}
        label={loadingLabel}
        density={density}
        rest={rest}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div {...rest}>
        {empty ?? (
          <EmptyState
            title="No events yet"
            description="Events appear here as they are recorded."
          />
        )}
      </div>
    );
  }

  // Runs of the same day, in the order given. An event with no instant stays in the run before it.
  const days: Day[] = [];
  if (groupByDay) {
    let previousDay: number | null = null;
    items.forEach((item, index) => {
      const at = toDate(item.at);
      const day = at === null ? previousDay : clock.dayNumber(at);
      const current = days[days.length - 1];
      if (current && day === previousDay) {
        current.events.push({ item, index });
      } else {
        days.push({
          key: `${day ?? 'undated'}-${item.id}`,
          label: at === null ? null : clock.dayLabel(at, now),
          events: [{ item, index }],
        });
      }
      previousDay = day;
    });
  }

  const last = items.length - 1;
  const railFor = (index: number): Rail | null => {
    // Under a day heading the line already runs into the first event from the heading above it.
    const first = index === 0 && days[0]?.label == null;
    if (first && index === last) return null;
    if (first) return 'from-node';
    if (index === last) return 'to-node';
    return 'full';
  };

  const renderEvent = (item: TimelineItem, index: number) => (
    <Event
      key={item.id}
      item={item}
      rail={railFor(index)}
      last={index === last}
      density={density}
      clock={clock}
      now={now}
      grouped={groupByDay}
    />
  );

  // Tailwind's reset sets list-style: none, which can make Safari with VoiceOver drop the list
  // semantics of a bare <ol>. Stating the role keeps "list, n items" announced for an event
  // history, where hearing how many events there are matters.
  const listProps = {
    ...rest,
    role: 'list',
    'data-density': density,
  } as const;

  if (!groupByDay) {
    return (
      // eslint-disable-next-line jsx-a11y/no-redundant-roles
      <ol {...listProps}>{items.map(renderEvent)}</ol>
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-redundant-roles
    <ol {...listProps}>
      {days.map((day, dayIndex) => (
        <li key={day.key}>
          {day.label !== null ? (
            <DayHeader
              label={day.label}
              level={headingLevel}
              rail={dayIndex === 0 ? 'from-node' : 'full'}
              density={density}
            />
          ) : null}
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <ol role="list">
            {day.events.map(({ item, index }) => renderEvent(item, index))}
          </ol>
        </li>
      ))}
    </ol>
  );
}
