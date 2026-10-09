import { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Select,
  Stack,
  TabToolbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
  Text,
} from '@hos/nova-ui';
import {
  useReceptionAction,
  useReceptionQuery,
  type DaySchedule,
  type Doctor,
  type ReceptionDataSource,
  type ScheduleEntry,
} from '../../data';
import { ActionFeedback, ReceptionTab, type ActionNotice } from '../../ui';
import { ScheduleDialog, type ScheduleDialogMode } from './schedule-dialog';
import type { ScheduleWidgetProps } from './types';

// The prototype's Day Schedule (02-reception.html, data-panel="schedule"): the doctors' day as a
// calendar you can book into and reschedule within, with a doctor filter.
export function ScheduleWidget({
  patientId,
  compactMode,
  className,
}: ScheduleWidgetProps) {
  const { query, source, reload, update } = useReceptionQuery((s) =>
    s.getSchedule(),
  );
  return (
    <ReceptionTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="Day Schedule"
      description="Each doctor's session, slot by slot: book a free slot or move a booking."
      query={query}
      errorMessage="Could not load the day schedule."
      onRetry={reload}
    >
      {query.status === 'ready' ? (
        <DayCalendar
          schedule={query.data}
          source={source}
          onChange={(next) => update(() => next)}
        />
      ) : null}
    </ReceptionTab>
  );
}

interface DayCalendarProps {
  schedule: DaySchedule;
  source: ReceptionDataSource;
  onChange: (schedule: DaySchedule) => void;
}

function DayCalendar({ schedule, source, onChange }: DayCalendarProps) {
  const action = useReceptionAction();
  const [filter, setFilter] = useState('all');
  const [dialog, setDialog] = useState<ScheduleDialogMode | null>(null);
  const [notice, setNotice] = useState<ActionNotice | null>(null);

  if (schedule.doctors.length === 0) {
    return (
      <EmptyState
        title="No doctors on the floor this session"
        description="The calendar fills in once a doctor's OPD session starts."
      />
    );
  }

  const doctors = schedule.doctors.filter(
    (doctor) => filter === 'all' || doctor.id === filter,
  );
  const title = `Doctor day calendar — ${schedule.date}`;
  const entryAt = (doctorId: string, time: string) =>
    schedule.entries.find(
      (entry) => entry.doctorId === doctorId && entry.time === time,
    );
  const nameOf = (doctorId: string) =>
    schedule.doctors.find((doctor) => doctor.id === doctorId)?.name ?? '';

  async function book(entryId: string, patientName: string, reason: string) {
    const next = await action.run(() =>
      source.bookScheduleSlot({ entryId, patientName, reason }),
    );
    if (!next) return;
    onChange(next);
    setDialog(null);
    const booked = next.entries.find((entry) => entry.id === entryId);
    if (booked?.kind === 'booked') {
      setNotice({
        title: `Slot booked — ${booked.time} · ${nameOf(booked.doctorId)}`,
        detail: `${booked.patientName} · token ${booked.token}`,
      });
    }
  }

  async function move(entryId: string, toEntryId: string) {
    const from = schedule.entries.find((entry) => entry.id === entryId);
    const next = await action.run(() =>
      source.rescheduleEntry(entryId, toEntryId),
    );
    if (!next) return;
    onChange(next);
    setDialog(null);
    const moved = next.entries.find((entry) => entry.id === toEntryId);
    if (from?.kind === 'booked' && moved) {
      setNotice({
        title: `Moved — ${from.token} · ${from.patientName} to ${moved.time}`,
        detail: `${nameOf(moved.doctorId)} · the patient's WhatsApp confirmation is updated`,
      });
    }
  }

  return (
    <Stack gap="s6">
      <ActionFeedback
        notice={notice}
        error={dialog ? null : action.error}
        onDismissNotice={() => setNotice(null)}
        onDismissError={action.clearError}
      />
      <Card>
        <CardHeader
          title={title}
          description={schedule.session}
          actions={
            <Button
              onClick={() => {
                setNotice(null);
                setDialog({ kind: 'book' });
              }}
            >
              <Text as="span" aria-hidden="true">
                +
              </Text>
              Book appointment
            </Button>
          }
        />
        <CardBody>
          <Stack gap="s4">
            <TabToolbar
              filters={
                <Select
                  label="Show the day for"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  options={[
                    { value: 'all', label: 'All doctors' },
                    ...schedule.doctors.map((doctor) => ({
                      value: doctor.id,
                      label: doctor.name,
                    })),
                  ]}
                />
              }
            />
            <Table caption={title}>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Time</TableHeaderCell>
                  {doctors.map((doctor) => (
                    <DoctorHeader key={doctor.id} doctor={doctor} />
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {schedule.times.map((time) => (
                  <TableRow key={time}>
                    <TableHeaderCell scope="row" className="font-mono">
                      {time}
                    </TableHeaderCell>
                    {doctors.map((doctor) => (
                      <TableCell key={doctor.id}>
                        <SlotCell
                          entry={entryAt(doctor.id, time)}
                          doctorName={doctor.name}
                          onBook={(entryId) => {
                            setNotice(null);
                            setDialog({ kind: 'book', entryId });
                          }}
                          onReschedule={(entryId) => {
                            setNotice(null);
                            setDialog({ kind: 'reschedule', entryId });
                          }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        </CardBody>
      </Card>
      {dialog ? (
        <ScheduleDialog
          mode={dialog}
          schedule={schedule}
          busy={action.busy}
          error={action.error}
          onClose={() => {
            setDialog(null);
            action.clearError();
          }}
          onBook={(entryId, patientName, reason) =>
            void book(entryId, patientName, reason)
          }
          onMove={(entryId, toEntryId) => void move(entryId, toEntryId)}
        />
      ) : null}
    </Stack>
  );
}

function DoctorHeader({ doctor }: { doctor: Doctor }) {
  return (
    <TableHeaderCell>
      <Stack gap="none">
        <Text as="span" weight="semibold">
          {doctor.name}
        </Text>
        <Text as="span" size="xs" tone="muted" className="normal-case">
          {`${doctor.department} · ${doctor.room}`}
        </Text>
      </Stack>
    </TableHeaderCell>
  );
}

interface SlotCellProps {
  entry: ScheduleEntry | undefined;
  doctorName: string;
  onBook: (entryId: string) => void;
  onReschedule: (entryId: string) => void;
}

function SlotCell({ entry, doctorName, onBook, onReschedule }: SlotCellProps) {
  if (!entry) return null;
  if (entry.kind === 'break') {
    return (
      <Text as="span" size="sm" tone="muted">
        Lunch break
      </Text>
    );
  }
  if (entry.kind === 'free') {
    return (
      <Button
        variant="outline"
        size="sm"
        aria-label={`Book ${entry.time} with ${doctorName}`}
        onClick={() => onBook(entry.id)}
      >
        + Book this slot
      </Button>
    );
  }
  return (
    <Stack
      direction="horizontal"
      align="center"
      justify="between"
      gap="s2"
      wrap
    >
      <Stack gap="none">
        <Stack direction="horizontal" align="center" gap="s2">
          <Tag variant="outline">{entry.token}</Tag>
          <Text as="span" weight="semibold">
            {entry.patientName}
          </Text>
        </Stack>
        <Text as="span" size="xs" tone="muted">
          {entry.reason}
        </Text>
      </Stack>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Reschedule ${entry.token} ${entry.patientName}`}
        onClick={() => onReschedule(entry.id)}
      >
        Reschedule
      </Button>
    </Stack>
  );
}
