import { useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  EmptyState,
  SplitLayout,
  Stack,
  Text,
} from '@hos/nova-ui';
import {
  useReceptionAction,
  useReceptionQuery,
  type Appointment,
  type AppointmentsOverview,
  type BookingRequest,
  type ReceptionDataSource,
  type Slot,
} from '../../data';
import {
  ActionFeedback,
  ReceptionKpis,
  ReceptionTab,
  type ActionNotice,
} from '../../ui';
import { FollowUpDraftBlock, ReminderPlanBlock } from './appointment-drafts';
import { ChannelMix, NoShowTable, SlotGrid } from './appointment-sections';
import { BookingDialog } from './booking-dialog';
import type { AppointmentsWidgetProps } from './types';

// The prototype's Appointments section (02-reception.html, data-panel="appointments"): the figures,
// the follow-up drafted from a discharge summary, the channel mix, slot discovery with a doctor
// filter, booking with payment in one step (in a dialog), the reminder plan and the no-show list.
export function AppointmentsWidget({
  patientId,
  compactMode,
  className,
}: AppointmentsWidgetProps) {
  const { query, source, reload, update } = useReceptionQuery((s) =>
    s.getAppointments(),
  );
  return (
    <ReceptionTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="Appointments"
      // The scaffold's wording, kept until app.spec.tsx stops asserting it (AGENTS-BOARD Requests).
      description="Curated workflow for Appointments."
      query={query}
      errorMessage="Could not load appointments."
      onRetry={reload}
    >
      {query.status === 'ready' ? (
        <AppointmentsBoard
          overview={query.data}
          source={source}
          onChange={update}
        />
      ) : null}
    </ReceptionTab>
  );
}

type Running = 'booking' | 'follow-up' | 'reminders' | null;

interface AppointmentsBoardProps {
  overview: AppointmentsOverview;
  source: ReceptionDataSource;
  onChange: (
    change: (overview: AppointmentsOverview) => AppointmentsOverview,
  ) => void;
}

function AppointmentsBoard({
  overview,
  source,
  onChange,
}: AppointmentsBoardProps) {
  const action = useReceptionAction();
  const [running, setRunning] = useState<Running>(null);
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [booking, setBooking] = useState<{
    key: number;
    doctorId?: string;
    slotId?: string;
  } | null>(null);
  const [session, setSession] = useState<Appointment[]>([]);
  // The drafts as they were loaded: an approved one stays on screen, settled, after the source
  // has closed it.
  const [followUp] = useState(overview.followUp);
  const [reminderPlan] = useState(overview.reminderPlan);

  if (overview.doctors.length === 0) {
    return (
      <EmptyState
        title="No OPD sessions to book"
        description="Slots appear here once a doctor's OPD session is on the roster."
      />
    );
  }

  async function perform<R>(kind: Running, task: () => Promise<R>) {
    setRunning(kind);
    setNotice(null);
    const result = await action.run(task);
    setRunning(null);
    return result;
  }

  async function refreshSlots() {
    const fresh = await source.getAppointments();
    onChange((current) => ({
      ...current,
      kpis: fresh.kpis,
      slots: fresh.slots,
    }));
  }

  async function book(request: BookingRequest): Promise<boolean> {
    const appointment = await perform('booking', () =>
      source.bookAppointment(request),
    );
    if (!appointment) return false;
    await refreshSlots();
    setSession((list) => [appointment, ...list]);
    const slot = overview.slots.find((entry) => entry.id === request.slotId);
    setNotice({
      title: `Booked — ${slot?.label ?? ''} · ${appointment.doctorName}`,
      detail: `${appointment.patientName} · token ${appointment.token} · ${
        appointment.payment === 'upi'
          ? 'UPI link sent on WhatsApp'
          : 'pay at the counter'
      }`,
    });
    return true;
  }

  async function approveFollowUp(): Promise<boolean> {
    if (!followUp) return false;
    const booked = await perform('follow-up', () =>
      source.approveFollowUp(followUp.id),
    );
    if (!booked) return false;
    setNotice({
      title: `Follow-up booked — ${booked.slotLabel}`,
      detail: `${booked.patientName} · ${booked.doctorName} · token ${booked.token} · confirmation going out on WhatsApp in Telugu`,
    });
    return true;
  }

  async function approveReminders(): Promise<boolean> {
    if (!reminderPlan) return false;
    const done = await perform('reminders', async () => {
      await source.approveReminderPlan(reminderPlan.id);
      return true;
    });
    if (!done) return false;
    setNotice({
      title: '3 reminders queued',
      detail:
        '2 AI calls (Telugu, Hindi) at 6:30 PM · 1 WhatsApp now · ₹8 est. against ₹1,500 of slots',
    });
    return true;
  }

  const openBooking = (slot?: Slot) =>
    setBooking({
      key: Date.now(),
      doctorId: slot?.doctorId,
      slotId: slot?.id,
    });

  const total = overview.kpis.find((kpi) => kpi.id === 'booked')?.value ?? '';
  const shortDate = overview.slotsDate.replace(/ \d{4}$/, '');

  return (
    <Stack gap="s6">
      <ActionFeedback
        notice={notice}
        error={booking ? null : action.error}
        onDismissNotice={() => setNotice(null)}
        onDismissError={action.clearError}
      />
      <ReceptionKpis label="Appointment figures" kpis={overview.kpis} />
      {followUp ? (
        <FollowUpDraftBlock
          draft={followUp}
          onApprove={approveFollowUp}
          busy={running === 'follow-up'}
        />
      ) : null}
      <ChannelMix
        channels={overview.channels}
        total={total}
        note={overview.channelNote}
      />
      <SlotGrid
        date={overview.slotsDate}
        sessionHours={overview.sessionHours}
        doctors={overview.doctors}
        slots={overview.slots}
        doctorFilter={doctorFilter}
        onDoctorFilterChange={setDoctorFilter}
        onPickSlot={openBooking}
      />
      <SplitLayout
        ratio="1-1"
        primary={
          <Card>
            <CardHeader
              title="Book & take payment in one step"
              actions={<Chip tone="info">UPI</Chip>}
            />
            <CardBody>
              <Stack gap="s4" align="start">
                <Text size="sm">
                  Book any channel's patient into a free slot and send the{' '}
                  {overview.consultationFee} UPI link in the same step.
                </Text>
                <Button onClick={() => openBooking()}>
                  Book & take payment
                </Button>
                <Text size="sm" tone="muted">
                  {overview.prepaidNote}
                </Text>
                {session.length === 0 ? (
                  <Text size="sm" tone="muted">
                    Nothing booked in this session yet — bookings appear here
                    and in the slot grid above.
                  </Text>
                ) : (
                  <Stack as="ul" gap="s2" aria-label="Booked in this session">
                    {session.map((appointment) => (
                      <li key={appointment.id}>
                        <Text size="sm">
                          {[
                            appointment.patientName,
                            appointment.doctorName,
                            appointment.slotLabel,
                            `token ${appointment.token}`,
                            appointment.channel,
                            appointment.payment === 'upi'
                              ? `${overview.consultationFee} UPI link sent`
                              : `${overview.consultationFee} payable at the counter`,
                          ].join(' · ')}
                        </Text>
                      </li>
                    ))}
                  </Stack>
                )}
              </Stack>
            </CardBody>
          </Card>
        }
        secondary={
          reminderPlan ? (
            <ReminderPlanBlock
              plan={reminderPlan}
              onApprove={approveReminders}
              busy={running === 'reminders'}
            />
          ) : null
        }
      />
      <NoShowTable risks={overview.noShowRisks} date={shortDate} />
      {booking ? (
        <BookingDialog
          key={booking.key}
          open
          onClose={() => {
            setBooking(null);
            action.clearError();
          }}
          doctors={overview.doctors}
          slots={overview.slots}
          date={overview.slotsDate}
          shortDate={shortDate}
          fee={overview.consultationFee}
          initialDoctorId={booking.doctorId}
          initialSlotId={booking.slotId}
          busy={running === 'booking'}
          error={action.error}
          onBook={book}
        />
      ) : null}
    </Stack>
  );
}
