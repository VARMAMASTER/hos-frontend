import {
  AiBadge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Grid,
  Select,
  Stack,
  TabToolbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  type ChipTone,
} from '@hos/nova-ui';
import type { ChannelShare, Doctor, NoShowRisk, Slot } from '../../data';

export interface ChannelMixProps {
  channels: ChannelShare[];
  total: string;
  note: string;
}

// How today's appointments arrived (the prototype's .chan-row). An AI channel says so in words.
export function ChannelMix({ channels, total, note }: ChannelMixProps) {
  return (
    <Card>
      <CardHeader
        title={`How today's ${total} appointments arrived`}
        description="Channel mix · the front desk now touches 32 of 64 (walk-in + phone)"
      />
      <CardBody>
        <Stack gap="s4">
          <Grid
            columns={1}
            gap="s3"
            className="sm:grid-cols-2 lg:grid-cols-5"
            role="list"
            aria-label="Booking channels"
          >
            {channels.map((channel) => (
              <Box
                key={channel.channel}
                role="listitem"
                border
                radius="card"
                padding="s3"
              >
                <Stack gap="s1">
                  {channel.ai ? <AiBadge label="AI channel" /> : null}
                  <Text as="span" size="sm" tone="muted" weight="semibold">
                    {channel.channel}
                  </Text>
                  <Text as="span" font="display" size="lg" weight="bold">
                    {channel.count}
                  </Text>
                  <Text as="span" size="xs" tone="muted">
                    {channel.share}
                  </Text>
                  <Box
                    aria-hidden="true"
                    radius="full"
                    className="mt-s1 h-s1 overflow-hidden bg-surface-2"
                  >
                    <Box
                      radius="full"
                      className={
                        channel.ai ? 'h-full bg-ai' : 'h-full bg-primary'
                      }
                      style={{ width: `${channel.barPercent}%` }}
                    />
                  </Box>
                </Stack>
              </Box>
            ))}
          </Grid>
          <Text size="sm" tone="muted">
            {note}
          </Text>
        </Stack>
      </CardBody>
    </Card>
  );
}

export interface SlotGridProps {
  date: string;
  sessionHours: string;
  doctors: Doctor[];
  slots: Slot[];
  doctorFilter: string;
  onDoctorFilterChange: (doctorId: string) => void;
  onPickSlot: (slot: Slot) => void;
}

// Slot discovery (the prototype's .slot-doc rows): a free slot is a button that opens the booking
// dialog; a taken one says so in words.
export function SlotGrid({
  date,
  sessionHours,
  doctors,
  slots,
  doctorFilter,
  onDoctorFilterChange,
  onPickSlot,
}: SlotGridProps) {
  const shown = doctors.filter(
    (doctor) => doctorFilter === 'all' || doctor.id === doctorFilter,
  );
  const shownSlots = slots.filter((slot) =>
    shown.some((doctor) => doctor.id === slot.doctorId),
  );
  const free = shownSlots.filter((slot) => slot.status === 'free').length;
  const title = `Slot discovery — ${date}`;
  return (
    <Card role="region" aria-label={title}>
      <CardHeader
        title={title}
        description={`Tap a free slot to book it · ${sessionHours}`}
        actions={<Chip tone="info">{`${free} free`}</Chip>}
      />
      <CardBody>
        <Stack gap="s4">
          <TabToolbar
            filters={
              <Select
                label="Show slots for"
                value={doctorFilter}
                onChange={(event) => onDoctorFilterChange(event.target.value)}
                options={[
                  { value: 'all', label: 'All doctors' },
                  ...doctors.map((doctor) => ({
                    value: doctor.id,
                    label: doctor.name,
                  })),
                ]}
              />
            }
          />
          {shown.map((doctor) => (
            <Stack
              key={doctor.id}
              direction="horizontal"
              align="center"
              justify="between"
              wrap
              gap="s3"
              className="border-b border-border pb-s3 last:border-b-0"
            >
              <Stack gap="none">
                <Text weight="semibold">{doctor.name}</Text>
                <Text size="xs" tone="muted">
                  {`${doctor.department} · ${doctor.room}`}
                </Text>
              </Stack>
              <Stack direction="horizontal" wrap gap="s2" align="center">
                {slots
                  .filter((slot) => slot.doctorId === doctor.id)
                  .map((slot) =>
                    slot.status === 'free' ? (
                      <Button
                        key={slot.id}
                        variant="outline"
                        size="sm"
                        aria-label={`Book ${slot.label} with ${doctor.name}`}
                        onClick={() => onPickSlot(slot)}
                      >
                        {slot.time}
                      </Button>
                    ) : (
                      <Chip key={slot.id}>
                        {`${slot.time} · ${slot.note ?? 'taken'}`}
                      </Chip>
                    ),
                  )}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
}

function riskChip(percent: number): { tone: ChipTone; word: string } {
  if (percent >= 60) return { tone: 'crit', word: 'High' };
  if (percent >= 30) return { tone: 'warn', word: 'Medium' };
  return { tone: 'good', word: 'Low' };
}

const ACTION_TONES: Record<NoShowRisk['action'], ChipTone> = {
  'ai-call-whatsapp': 'ai',
  'ai-call': 'ai',
  whatsapp: 'info',
  none: 'neutral',
};

// Tomorrow's no-show forecast (the prototype's #apRiskBody). Risk leads, in words as well as tone.
export function NoShowTable({
  risks,
  date,
}: {
  risks: NoShowRisk[];
  date: string;
}) {
  return (
    <Card>
      <CardHeader
        title="No-show risk — tomorrow's list"
        description="Operational forecast from attendance and payment history"
        actions={<Chip tone="good">GREEN · ADR #7</Chip>}
      />
      <CardBody>
        <Table caption="No-show risk — tomorrow's list">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Risk</TableHeaderCell>
              <TableHeaderCell>Patient</TableHeaderCell>
              <TableHeaderCell>{`Slot · ${date}`}</TableHeaderCell>
              <TableHeaderCell>Doctor</TableHeaderCell>
              <TableHeaderCell>Why (operational signals only)</TableHeaderCell>
              <TableHeaderCell>Suggested action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {risks.map((risk) => {
              const chip = riskChip(risk.riskPercent);
              const ai = ACTION_TONES[risk.action] === 'ai';
              return (
                <TableRow key={risk.id}>
                  <TableCell>
                    <Chip
                      tone={chip.tone}
                    >{`${risk.riskPercent}% · ${chip.word}`}</Chip>
                  </TableCell>
                  <TableCell>
                    <Stack gap="none">
                      <Text as="span" weight="semibold">
                        {risk.patientName}
                      </Text>
                      <Text as="span" size="xs" tone="muted">
                        {`${risk.ageSex} · ${risk.language}`}
                      </Text>
                    </Stack>
                  </TableCell>
                  <TableCell mono>{risk.slot}</TableCell>
                  <TableCell>{risk.doctorName}</TableCell>
                  <TableCell>
                    <Text as="span" size="sm" tone="muted">
                      {risk.why}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Chip
                      tone={ACTION_TONES[risk.action]}
                      icon={ai ? '✦' : undefined}
                    >
                      {risk.actionLabel}
                    </Chip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
