// The clock behind Timeline: instants in, words out. Pure, and given the zone and "now" by the
// caller, so what a timeline says never depends on the machine it renders on.

export type TimelineInstant = Date | string | number;

export function toDate(value: TimelineInstant | undefined): Date | null {
  if (value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// "just now", "5 min ago", "2 h ago", "3 d ago", and the same ahead of now ("in 10 min"). Beyond a
// month a relative phrase stops helping, so there is none and the caller shows the date.
export function formatRelative(then: Date, now: Date): string | null {
  const diff = now.getTime() - then.getTime();
  const span = Math.abs(diff);
  if (span < MINUTE) return 'just now';
  let phrase: string;
  if (span < HOUR) phrase = `${Math.floor(span / MINUTE)} min`;
  else if (span < DAY) phrase = `${Math.floor(span / HOUR)} h`;
  else if (span < 30 * DAY) phrase = `${Math.floor(span / DAY)} d`;
  else return null;
  return diff >= 0 ? `${phrase} ago` : `in ${phrase}`;
}

export interface TimelineClock {
  // The calendar day of an instant in the zone, as a day count: equal for the same day, one apart
  // for neighbours.
  dayNumber: (date: Date) => number;
  year: (date: Date) => number;
  // 14:05, 24-hour.
  clock: (date: Date) => string;
  // 3 Oct, or 3 Oct 2026 when the year differs from `now`'s.
  date: (date: Date, now: Date) => string;
  // "Today", "Yesterday", "Tomorrow", or the full date.
  dayLabel: (date: Date, now: Date) => string;
  // The clock alone on the same day as now (or when a day heading already gives the date), the date
  // and clock otherwise.
  absolute: (date: Date, now: Date, withinDay: boolean) => string;
}

export function makeClock(timeZone?: string): TimelineClock {
  // An unknown zone name throws; fall back to the machine's rather than break the page.
  const format = (options: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat('en-GB', { ...options, timeZone });
    } catch {
      return new Intl.DateTimeFormat('en-GB', options);
    }
  };
  const ymd = format({ year: 'numeric', month: 'numeric', day: 'numeric' });
  const hm = format({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const dm = format({ day: 'numeric', month: 'short' });
  const dmy = format({ day: 'numeric', month: 'short', year: 'numeric' });

  const part = (date: Date, type: 'year' | 'month' | 'day') =>
    Number(ymd.formatToParts(date).find((p) => p.type === type)?.value);
  const dayNumber = (date: Date) =>
    Math.round(
      Date.UTC(part(date, 'year'), part(date, 'month') - 1, part(date, 'day')) /
        DAY,
    );
  const year = (date: Date) => part(date, 'year');
  const dateLabel = (date: Date, now: Date) =>
    (year(date) === year(now) ? dm : dmy).format(date);

  return {
    dayNumber,
    year,
    clock: (date) => hm.format(date),
    date: dateLabel,
    dayLabel: (date, now) => {
      const apart = dayNumber(now) - dayNumber(date);
      if (apart === 0) return 'Today';
      if (apart === 1) return 'Yesterday';
      if (apart === -1) return 'Tomorrow';
      return dmy.format(date);
    },
    absolute: (date, now, withinDay) =>
      withinDay || dayNumber(date) === dayNumber(now)
        ? hm.format(date)
        : `${dateLabel(date, now)}, ${hm.format(date)}`,
  };
}
