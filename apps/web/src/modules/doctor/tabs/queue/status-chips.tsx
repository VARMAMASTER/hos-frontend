import { Chip, type ChipTone } from '@hos/nova-ui';
import type { QueueStatus, Urgency } from '../../data';

// A patient's place in the session as a word and a glyph (never colour alone): a dot in the room, a
// tick when seen, a clock while waiting, a calendar when only booked.
const STATUSES: Record<
  QueueStatus,
  { label: string; icon: string; tone: ChipTone }
> = {
  'in-room': { label: 'In room', icon: '●', tone: 'info' },
  done: { label: 'Done', icon: '✓', tone: 'good' },
  waiting: { label: 'Waiting', icon: '◷', tone: 'neutral' },
  booked: { label: 'Booked', icon: '▦', tone: 'info' },
};

export function QueueStatusChip({ status }: { status: QueueStatus }) {
  const { label, icon, tone } = STATUSES[status];
  return (
    <Chip tone={tone} icon={icon} data-queue-status={status}>
      {label}
    </Chip>
  );
}

// The complaint, with a mark when it needs a look sooner: a warning triangle for urgent and an
// open circle for review, so priority is a shape as well as a colour.
const COMPLAINTS: Record<Urgency, { icon?: string; tone: ChipTone }> = {
  urgent: { icon: '⚠', tone: 'crit' },
  review: { icon: '◔', tone: 'warn' },
  routine: { tone: 'neutral' },
};

export function ComplaintChip({
  complaint,
  urgency,
}: {
  complaint: string;
  urgency: Urgency;
}) {
  const { icon, tone } = COMPLAINTS[urgency];
  return (
    <Chip tone={tone} icon={icon} data-urgency={urgency}>
      {complaint}
    </Chip>
  );
}
