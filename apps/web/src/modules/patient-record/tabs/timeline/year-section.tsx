import { useId } from 'react';
import {
  Box,
  Button,
  Chip,
  Heading,
  Stack,
  Text,
  Timeline,
} from '@hos/nova-ui';
import type { TimelineEvent, TimelineYear } from '../../data';
import { toTimelineItem } from './event-item';

export interface YearSectionProps {
  year: TimelineYear;
  // The events of this year that pass the filters.
  visible: TimelineEvent[];
  loading: boolean;
  onExpand: (year: number) => void;
}

function countText(year: TimelineYear): string {
  if (year.external > 0) {
    const who = year.external === 1 ? 'another hospital' : 'other hospitals';
    return `${year.total} events · ${year.external} from ${who}`;
  }
  return year.blurb
    ? `${year.total} events · ${year.blurb}`
    : `${year.total} events`;
}

// One year of the record: its heading, its honest count, and either its events or, while it is
// closed, a preview of what it holds. The preview is plain text, not a hover tip, so a keyboard or
// touch user reads it too.
export function YearSection({
  year,
  visible,
  loading,
  onExpand,
}: YearSectionProps) {
  const headingId = useId();
  const open = year.events !== null;
  return (
    <Box
      as="section"
      id={`timeline-year-${year.year}`}
      aria-labelledby={headingId}
    >
      <Stack gap="s4">
        <Stack direction="horizontal" align="center" wrap gap="s4">
          <Heading id={headingId} level="h3" font="display">
            {String(year.year)}
          </Heading>
          <Text as="span" size="sm" tone="muted">
            {countText(year)}
          </Text>
          <Box
            aria-hidden="true"
            className="min-w-s8 flex-1 border-t border-border"
          />
          {open ? (
            <Chip tone="neutral">Open</Chip>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              loading={loading}
              loadingText="Loading…"
              onClick={() => onExpand(year.year)}
            >
              {`Expand ${year.year}`}
            </Button>
          )}
        </Stack>
        {open && visible.length > 0 ? (
          <Timeline
            aria-label={`${year.year} events`}
            density="compact"
            items={visible.map(toTimelineItem)}
          />
        ) : null}
        {open && visible.length === 0 ? (
          <Text tone="muted">{`No events in ${year.year} match these filters.`}</Text>
        ) : null}
        {!open && year.preview.length > 0 ? (
          <Stack
            as="ul"
            gap="s1"
            className="list-disc pl-s7 text-control text-ink-2"
          >
            {year.preview.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}
