import { Box, Stack, Text, cx, focusRing } from '@hos/nova-ui';
import type { TimelineYear } from '../../data';

export interface YearStripProps {
  // Oldest first, left to right.
  years: TimelineYear[];
  onSelect: (year: number) => void;
}

function describe(year: TimelineYear): string {
  const outside =
    year.external === 0
      ? ''
      : `, ${year.external} from ${year.external === 1 ? 'another hospital' : 'other hospitals'}`;
  return `${year.year} — ${year.total} events${outside}`;
}

// The density strip (the prototype's .yd-strip): four years must be graspable without scrolling, so
// each year is a bar, tall for the events recorded that year, with the part that came from other
// hospitals on top. A bar is also a button that opens its year. The count and the year are written
// under it, and the button's name carries both, so nothing here rests on the bar's height or colour.
export function YearStrip({ years, onSelect }: YearStripProps) {
  const tallest = Math.max(1, ...years.map((year) => year.total));
  return (
    <Stack
      direction="horizontal"
      align="end"
      gap="s4"
      wrap
      role="group"
      aria-label="Events per year — select a year to open it"
    >
      {years.map((year) => {
        const open = year.events !== null;
        const inside = year.total - year.external;
        return (
          <button
            key={year.year}
            type="button"
            aria-label={describe(year)}
            aria-pressed={open}
            onClick={() => onSelect(year.year)}
            className={cx(
              'flex cursor-pointer flex-col items-center gap-s1 rounded-control border px-s4 py-s2',
              'motion-safe:transition-colors motion-safe:duration-fast',
              open
                ? 'border-primary bg-primary-soft'
                : 'border-transparent hover:border-border-strong',
              focusRing,
            )}
          >
            <Box
              aria-hidden="true"
              className="flex h-s10 w-s6 flex-col justify-end overflow-hidden rounded-tag"
            >
              <Box
                className="bg-highlight"
                style={{ height: `${(year.external / tallest) * 100}%` }}
              />
              <Box
                className="bg-primary"
                style={{ height: `${(inside / tallest) * 100}%` }}
              />
            </Box>
            <Text
              as="span"
              size="sm"
              weight="semibold"
              className="tabular-nums"
              aria-hidden="true"
            >
              {year.total}
            </Text>
            <Text as="span" size="xs" tone="muted" aria-hidden="true">
              {year.year}
            </Text>
          </button>
        );
      })}
    </Stack>
  );
}
