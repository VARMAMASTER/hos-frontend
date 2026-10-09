import { Chip, Stack, Tag, Text, type TimelineItem } from '@hos/nova-ui';
import type { TimelineEvent } from '../../data';
import { FlagChip } from '../../ui';

// One recorded event as a Nova timeline item. The department or the outside facility is always
// named, because provenance must be visible, not inferred; an outside event also carries a mark and
// the words "via ABHA", so it never rests on colour.
export function toTimelineItem(event: TimelineEvent): TimelineItem {
  const outside = event.source === 'ext';
  return {
    id: event.id,
    time: event.dateLabel,
    title: event.title,
    icon: outside ? '⇄' : undefined,
    description: (
      <Stack gap="s2">
        <Stack direction="horizontal" align="center" wrap gap="s2">
          <Tag tone="neutral" variant="outline">
            {event.kindLabel}
          </Tag>
          {event.flag ? <FlagChip flag={event.flag} /> : null}
          {outside ? (
            <Chip tone="highlight">{`${event.facility} · via ABHA`}</Chip>
          ) : null}
        </Stack>
        <Text size="sm" tone="muted">
          {event.where}
        </Text>
        <Text size="sm">{event.summary}</Text>
        {event.note ? (
          <Text size="sm" tone="muted" lang={event.noteLang}>
            {event.note}
          </Text>
        ) : null}
      </Stack>
    ),
  };
}
