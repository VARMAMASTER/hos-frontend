import { useRef, useState } from 'react';
import {
  Banner,
  Button,
  Dialog,
  Select,
  Stack,
  Text,
  TextField,
} from '@hos/nova-ui';
import type { DaySchedule, ScheduleEntry } from '../../data';

export type ScheduleDialogMode =
  // Book a slot: the one clicked, or any free slot when none was.
  | { kind: 'book'; entryId?: string }
  // Move a booking to another free slot of the same doctor.
  | { kind: 'reschedule'; entryId: string };

export interface ScheduleDialogProps {
  mode: ScheduleDialogMode;
  schedule: DaySchedule;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onBook: (entryId: string, patientName: string, reason: string) => void;
  onMove: (entryId: string, toEntryId: string) => void;
}

function doctorName(schedule: DaySchedule, doctorId: string): string {
  return schedule.doctors.find((doctor) => doctor.id === doctorId)?.name ?? '';
}

// Booking into the day, or rescheduling within it. HOS only ever offers slots that are free.
export function ScheduleDialog({
  mode,
  schedule,
  busy,
  error,
  onClose,
  onBook,
  onMove,
}: ScheduleDialogProps) {
  const entry = mode.entryId
    ? schedule.entries.find((item) => item.id === mode.entryId)
    : undefined;
  const free = schedule.entries.filter(
    (item): item is Extract<ScheduleEntry, { kind: 'free' }> =>
      item.kind === 'free',
  );
  const choices =
    mode.kind === 'reschedule' && entry
      ? free.filter((item) => item.doctorId === entry.doctorId)
      : free;
  const [target, setTarget] = useState(
    mode.kind === 'book' && entry ? entry.id : (choices[0]?.id ?? ''),
  );
  const [patientName, setPatientName] = useState('');
  const [reason, setReason] = useState('');
  const [nameError, setNameError] = useState<string>();
  const nameRef = useRef<HTMLInputElement>(null);

  const slotLabel = (item: ScheduleEntry) =>
    `${item.time} · ${doctorName(schedule, item.doctorId)}`;

  let title = 'Book appointment';
  if (mode.kind === 'book' && entry) title = `Book ${slotLabel(entry)}`;
  if (mode.kind === 'reschedule' && entry?.kind === 'booked') {
    title = `Reschedule ${entry.token} · ${entry.patientName}`;
  }

  function submit() {
    if (mode.kind === 'reschedule') {
      if (target) onMove(mode.entryId, target);
      return;
    }
    if (!patientName.trim()) {
      setNameError("Enter the patient's name.");
      nameRef.current?.focus();
      return;
    }
    onBook(target, patientName.trim(), reason.trim());
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      description={`${schedule.date} · a slot that clashes with a theatre list or leave is never offered.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            loading={busy}
            aria-disabled={!target || undefined}
          >
            {mode.kind === 'reschedule' ? 'Move appointment' : 'Book slot'}
          </Button>
        </>
      }
    >
      <Stack gap="s4">
        {error ? (
          <Banner tone="crit" title="Not saved">
            {error}
          </Banner>
        ) : null}
        {mode.kind === 'reschedule' ? (
          choices.length > 0 ? (
            <Select
              label="Move to"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              options={choices.map((item) => ({
                value: item.id,
                label: slotLabel(item),
              }))}
            />
          ) : (
            <Text tone="muted">
              No free slot is left with this doctor today. Offer the next
              session instead.
            </Text>
          )
        ) : (
          <>
            {entry ? null : (
              <Select
                label="Free slot"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                placeholder={
                  free.length === 0 ? 'No free slot today' : undefined
                }
                options={free.map((item) => ({
                  value: item.id,
                  label: slotLabel(item),
                }))}
              />
            )}
            <TextField
              ref={nameRef}
              label="Patient name"
              placeholder="e.g. R. Sailaja"
              required
              autoComplete="off"
              value={patientName}
              error={nameError}
              onChange={(event) => {
                setPatientName(event.target.value);
                if (event.target.value.trim()) setNameError(undefined);
              }}
            />
            <TextField
              label="Reason"
              placeholder="e.g. New consult · fever"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </>
        )}
      </Stack>
    </Dialog>
  );
}
