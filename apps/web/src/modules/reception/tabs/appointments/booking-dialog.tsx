import { useRef, useState } from 'react';
import {
  Banner,
  Button,
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  Select,
  Stack,
  Text,
  TextField,
} from '@hos/nova-ui';
import type {
  BookingChannel,
  BookingRequest,
  Doctor,
  PaymentMode,
  Slot,
} from '../../data';

const CHANNELS: BookingChannel[] = [
  'Walk-in',
  'Phone',
  'WhatsApp',
  'AI voice call',
];

export interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  doctors: Doctor[];
  slots: Slot[];
  // "Mon 20 Jul 2026", and the short form the slot field is labelled with ("Mon 20 Jul").
  date: string;
  shortDate: string;
  fee: string;
  // The doctor and slot a click on the grid chose.
  initialDoctorId?: string;
  initialSlotId?: string;
  busy: boolean;
  // What the source said when the booking failed.
  error: string | null;
  // Resolves true once booked, so the dialog closes.
  onBook: (request: BookingRequest) => Promise<boolean>;
}

interface Errors {
  patientName?: string;
  phone?: string;
  slot?: string;
}

function digitsOf(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
}

// The prototype's "Book & take payment in one step" form, in a dialog: the patient, the doctor and
// a free slot (only ever the doctor's own free slots, so the form cannot offer a taken one), the
// channel the booking came in on, and how the ₹500 is paid. Errors are announced and focus goes to
// the first field that needs fixing.
export function BookingDialog({
  open,
  onClose,
  doctors,
  slots,
  date,
  shortDate,
  fee,
  initialDoctorId,
  initialSlotId,
  busy,
  error,
  onBook,
}: BookingDialogProps) {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [doctorId, setDoctorId] = useState(
    initialDoctorId ?? doctors[0]?.id ?? '',
  );
  const freeFor = (id: string) =>
    slots.filter((slot) => slot.doctorId === id && slot.status === 'free');
  const [slotId, setSlotId] = useState(
    initialSlotId ?? freeFor(doctorId)[0]?.id ?? '',
  );
  const [channel, setChannel] = useState<BookingChannel>('Walk-in');
  const [payment, setPayment] = useState<PaymentMode>('upi');
  const [errors, setErrors] = useState<Errors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const slotRef = useRef<HTMLSelectElement>(null);

  const free = freeFor(doctorId);

  async function submit() {
    const next: Errors = {};
    if (!patientName.trim()) next.patientName = "Enter the patient's name.";
    if (digitsOf(phone).length !== 10) {
      next.phone =
        'Enter a 10-digit mobile number, for the UPI link and the confirmation.';
    }
    if (!free.some((slot) => slot.id === slotId)) {
      next.slot = 'Pick one of the free slots.';
    }
    setErrors(next);
    const firstInvalid = next.patientName
      ? nameRef.current
      : next.phone
        ? phoneRef.current
        : next.slot
          ? slotRef.current
          : null;
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    const booked = await onBook({
      patientName: patientName.trim(),
      phone,
      doctorId,
      slotId,
      channel,
      payment,
    });
    if (booked) onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Book an appointment"
      description={`${date} · every channel writes to the same slot table, so a slot cannot be double-booked.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={busy}>
            {payment === 'upi'
              ? 'Book & send UPI link'
              : 'Book · pay at counter'}
          </Button>
        </>
      }
    >
      <Stack gap="s4">
        {error ? (
          <Banner tone="crit" title="Not booked">
            {error}
          </Banner>
        ) : null}
        <Stack gap="s2">
          <Text as="span" variant="label" tone="muted">
            Channel
          </Text>
          <ButtonGroup
            aria-label="Channel"
            size="sm"
            value={channel}
            onValueChange={(value) => setChannel(value as BookingChannel)}
          >
            {CHANNELS.map((item) => (
              <ButtonGroupItem key={item} value={item}>
                {item}
              </ButtonGroupItem>
            ))}
          </ButtonGroup>
        </Stack>
        <TextField
          ref={nameRef}
          label="Patient name"
          placeholder="e.g. S. Harika"
          required
          autoComplete="off"
          value={patientName}
          error={errors.patientName}
          onChange={(event) => setPatientName(event.target.value)}
        />
        <TextField
          ref={phoneRef}
          label="Mobile (for UPI + confirmation)"
          placeholder="+91 …"
          required
          inputMode="tel"
          autoComplete="off"
          value={phone}
          error={errors.phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <Select
          label="Doctor"
          value={doctorId}
          options={doctors.map((doctor) => ({
            value: doctor.id,
            label: `${doctor.name} — ${doctor.department}`,
          }))}
          onChange={(event) => {
            setDoctorId(event.target.value);
            setSlotId(freeFor(event.target.value)[0]?.id ?? '');
          }}
        />
        <Select
          ref={slotRef}
          label={`Slot · ${shortDate}`}
          value={slotId}
          required
          placeholder={
            free.length === 0 ? 'No free slot — offer the next day' : undefined
          }
          error={errors.slot}
          options={free.map((slot) => ({ value: slot.id, label: slot.label }))}
          onChange={(event) => setSlotId(event.target.value)}
        />
        <Stack gap="s2">
          <Text as="span" variant="label" tone="muted">
            {`Consultation ${fee}`}
          </Text>
          <ButtonGroup
            aria-label={`Consultation ${fee}`}
            size="sm"
            value={payment}
            onValueChange={(value) => setPayment(value as PaymentMode)}
          >
            <ButtonGroupItem value="upi">UPI link on WhatsApp</ButtonGroupItem>
            <ButtonGroupItem value="counter">Pay at counter</ButtonGroupItem>
          </ButtonGroup>
        </Stack>
      </Stack>
    </Dialog>
  );
}
