import type {
  AppointmentsOverview,
  DaySchedule,
  Doctor,
  PhoneLookup,
  QueueSnapshot,
  ReferralsOverview,
  RegistrationOverview,
  ScheduleEntry,
  Slot,
} from './types';

// Invented sample data for the front desk, taken from the prototype page (os/public/02-reception.html)
// so the tabs can be checked against it. Every person here is fictional; no real patient is in it.

export const DOCTORS: Doctor[] = [
  {
    id: 'dr-ramesh',
    name: 'Dr. K. Ramesh',
    department: 'General Medicine',
    room: 'Room 3',
  },
  {
    id: 'dr-anil',
    name: 'Dr. P. Anil Kumar',
    department: 'Orthopedics',
    room: 'Room 4',
  },
  {
    id: 'dr-sunitha',
    name: 'Dr. Sunitha Rao',
    department: 'Gynecology',
    room: 'Room 5',
  },
];

// The token sequence the counter, the slot grid and the AI channels share, so no two bookings ever
// get the same number. The prototype's sequence starts after T-26.
export const FIRST_TOKEN = 27;

export function seedQueue(): QueueSnapshot {
  return {
    kpis: [
      {
        id: 'appointments',
        label: "Today's appointments",
        value: '64',
        delta: '6 vs yesterday',
        trend: 'up',
        sentiment: 'good',
      },
      {
        id: 'walk-ins',
        label: 'Walk-ins',
        value: '18',
        delta: "28% of today's load",
      },
      {
        id: 'no-shows',
        label: 'No-shows recovered',
        value: '5',
        delta: 'via WhatsApp reminder',
        trend: 'up',
        sentiment: 'good',
      },
      {
        id: 'waiting',
        label: 'Waiting now',
        value: '9',
        delta: 'avg wait 14 min',
      },
    ],
    tokens: [
      {
        token: 'T-10',
        patientName: 'Ch. Lakshmi',
        department: 'General Medicine',
        doctorName: 'Dr. K. Ramesh',
        room: 'Room 3',
        state: 'done',
        at: '10:02 AM',
      },
      {
        token: 'T-11',
        patientName: 'Md. Rafi',
        department: 'General Medicine',
        doctorName: 'Dr. K. Ramesh',
        room: 'Room 3',
        state: 'done',
        at: '10:21 AM',
      },
      {
        token: 'T-12',
        patientName: 'Venkatesh Naidu',
        ageSex: '44M',
        reason: 'Hypertension review',
        department: 'General Medicine',
        doctorName: 'Dr. K. Ramesh',
        room: 'Room 3',
        state: 'in-consultation',
        at: '10:38 AM',
      },
      waiting('T-13', 'Lakshmi Devi', 'General Medicine', 6),
      waiting('T-14', 'Padma Sree', 'Gynecology', 9),
      waiting('T-15', 'Mohd. Irfan', 'General Medicine', 11),
      waiting('T-16', 'B. Srinu', 'Orthopedics', 14),
      waiting('T-17', 'Baby of K. Ramana', 'Pediatrics', 18),
      waiting('T-18', 'Y. Padmavathi', 'Orthopedics', 2),
    ],
  };
}

function waiting(
  token: string,
  patientName: string,
  department: QueueSnapshot['tokens'][number]['department'],
  waitingMinutes: number,
): QueueSnapshot['tokens'][number] {
  const doctor =
    DOCTORS.find((entry) => entry.department === department) ?? DOCTORS[0];
  return {
    token,
    patientName,
    department,
    doctorName: department === 'Pediatrics' ? 'Dr. K. Ramesh' : doctor.name,
    room: department === 'Pediatrics' ? 'Room 3' : doctor.room,
    state: 'waiting',
    waitingMinutes,
  };
}

// The slot grid for Mon 20 Jul: [time, free or taken, note].
const SLOT_GRID: Record<string, [string, 'free' | 'taken', string?][]> = {
  'dr-ramesh': [
    ['09:00', 'taken'],
    ['09:30', 'free'],
    ['10:00', 'taken'],
    ['10:30', 'taken'],
    ['11:00', 'free'],
    ['11:30', 'taken'],
    ['12:00', 'free'],
    ['12:30', 'taken'],
  ],
  'dr-anil': [
    ['09:00', 'taken'],
    ['09:30', 'taken'],
    ['10:00', 'free'],
    ['10:30', 'free'],
    ['11:00', 'taken', 'OT'],
    ['11:30', 'taken', 'OT'],
    ['12:00', 'free'],
  ],
  'dr-sunitha': [
    ['09:00', 'free'],
    ['09:30', 'taken'],
    ['10:00', 'taken'],
    ['10:30', 'free'],
    ['11:00', 'free'],
    ['11:30', 'taken'],
    ['12:00', 'free'],
    ['12:30', 'free'],
  ],
};

// "09:30" as a booking says it: "09:30 AM", "12:00 noon", "12:30 PM".
export function slotLabel(time: string): string {
  if (time === '12:00') return '12:00 noon';
  return `${time} ${Number(time.slice(0, 2)) >= 12 ? 'PM' : 'AM'}`;
}

function seedSlots(): Slot[] {
  return Object.entries(SLOT_GRID).flatMap(([doctorId, slots]) =>
    slots.map(([time, status, note]) => ({
      id: `${doctorId}-${time}`,
      doctorId,
      time,
      label: slotLabel(time),
      status,
      note,
    })),
  );
}

export function seedAppointments(): AppointmentsOverview {
  return {
    kpis: [
      {
        id: 'booked',
        label: 'Booked for today',
        value: '64',
        delta: 'across 5 channels',
      },
      {
        id: 'prepaid',
        label: 'Prepaid at booking',
        value: '26',
        delta: '41% of today · was 24% on 01 Jul',
        trend: 'up',
        sentiment: 'good',
      },
      {
        id: 'no-show-rate',
        label: 'No-show rate · month to date',
        value: '9.1%',
        delta: '90 of 990 booked',
      },
      {
        id: 'free-slots',
        label: 'Free slots next working day',
        value: '11',
        delta: 'Mon 20 Jul · Sunday closed · 3 doctors on floor',
      },
    ],
    slotsDate: 'Mon 20 Jul 2026',
    sessionHours: 'OPD session 09:00 AM – 01:00 PM',
    doctors: DOCTORS.map((doctor) => ({ ...doctor })),
    slots: seedSlots(),
    channels: [
      {
        channel: 'Walk-in',
        count: 18,
        share: '28% · counter',
        barPercent: 85,
        ai: false,
      },
      {
        channel: 'Phone → front desk',
        count: 14,
        share: '22% · Swapna',
        barPercent: 67,
        ai: false,
      },
      {
        channel: 'WhatsApp assistant',
        count: 21,
        share: '33% · no staff time',
        barPercent: 100,
        ai: true,
      },
      {
        channel: 'AI voice call',
        count: 9,
        share: '14% · no staff time',
        barPercent: 43,
        ai: true,
      },
      {
        channel: 'Web / portal',
        count: 2,
        share: '3% · self-serve',
        barPercent: 9,
        ai: false,
      },
    ],
    channelNote:
      '30 of 64 (47%) were booked by an AI channel with no staff involved. Every channel writes to the same slot table — a WhatsApp booking and a walk-in cannot double-book a slot.',
    followUp: {
      id: 'fu-srinu',
      patientName: 'B. Srinu',
      summarySource:
        'Read from the signed discharge summary for B. Srinu (67M, post-op right total knee replacement, Dr. P. Anil Kumar). Nothing is booked and no message has been sent.',
      askedFor: {
        title: 'Review with Dr. P. Anil Kumar',
        detail: 'Suture removal and wound check',
        date: '26 Jul 2026',
      },
      proposed: {
        title: 'Mon 27 Jul 2026 · 10:30 AM',
        detail: 'Orthopedics OPD · Dr. P. Anil Kumar · Room 3',
      },
      whyNot: {
        title: 'Sunday — no ortho OPD',
        detail: 'Next working session is Monday morning',
      },
      caution:
        'The date in the summary falls on a Sunday. The proposed slot moves it to the next working session — a clinician should confirm that a one-day shift is acceptable before this is booked.',
      reasons: [
        "The discharge summary's follow-up plan reads: review with Dr. P. Anil Kumar in OPD on 26 Jul 2026 for suture removal and wound check.",
        '26 Jul 2026 is a Sunday. Orthopedics has no OPD session that day, so a booking would exist against a clinic that isn’t running.',
        "The nearest orthopaedic session is Monday 27 Jul; 10:30 AM is free on Dr. P. Anil Kumar's list.",
        'His mobile is on file from admission, so the confirmation and the reminder both go out on WhatsApp in Telugu once Swapna books it.',
      ],
      sources:
        "IPD discharge summary (follow-up plan) · Orthopedics OPD roster · Dr. P. Anil Kumar's Monday list · patient contact from admission",
      otherSessions:
        "Dr. P. Anil Kumar's orthopaedic sessions that week: Mon 27 Jul 09:00–13:00, Wed 29 Jul 09:00–13:00, Fri 31 Jul 14:00–17:00. A suture check has a clinical window, so if none of these work the consultant decides the date — not the front desk and not HOS.",
    },
    reminderPlan: {
      id: 'plan-reminders',
      title: "Reminder plan for tomorrow's 3 flagged appointments",
      summary:
        'Two AI voice calls this evening (Telugu for M. Sailoo, Hindi for Sk. Zubeda) and one WhatsApp reminder (G. Latha, first visit). ₹8 of call minutes against ₹1,500 of slot value — 3 slots × ₹500. Nothing is dialled until you approve; the calling window closes at 8:00 PM.',
      signals:
        'attendance history, payment status, distance, slot time, reschedule count · ADR #7 GREEN — no symptom, diagnosis or urgency is used or produced',
    },
    noShowRisks: [
      {
        id: 'risk-sailoo',
        riskPercent: 78,
        patientName: 'M. Sailoo',
        ageSex: '57M',
        language: 'Telugu',
        slot: '09:30 AM',
        doctorName: 'Dr. P. Anil Kumar',
        why: 'Missed 2 of last 3 · unpaid · 14 km away · post-fracture check overdue since 28 Jun',
        action: 'ai-call-whatsapp',
        actionLabel: 'AI call + WhatsApp',
      },
      {
        id: 'risk-zubeda',
        riskPercent: 71,
        patientName: 'Sk. Zubeda',
        ageSex: '51F',
        language: 'Hindi',
        slot: '12:30 PM',
        doctorName: 'Dr. K. Ramesh',
        why: '1 previous no-show · unpaid · the last slot of a session carries 28% of all no-shows',
        action: 'ai-call',
        actionLabel: 'AI call this evening',
      },
      {
        id: 'risk-latha',
        riskPercent: 44,
        patientName: 'G. Latha',
        ageSex: '41F',
        language: 'Telugu',
        slot: '10:00 AM',
        doctorName: 'Dr. Sunitha Rao',
        why: 'First visit · unpaid · booked 6 weeks ago, no contact since',
        action: 'whatsapp',
        actionLabel: 'WhatsApp reminder',
      },
      {
        id: 'risk-anjaneyulu',
        riskPercent: 14,
        patientName: 'T. Anjaneyulu',
        ageSex: '62M',
        language: 'Telugu',
        slot: '10:00 AM',
        doctorName: 'Dr. K. Ramesh',
        why: 'Prepaid ₹500 by UPI after an AI reminder call · attended 5 of 5',
        action: 'none',
        actionLabel: 'No action',
      },
      {
        id: 'risk-ritu',
        riskPercent: 9,
        patientName: 'Ritu Agarwal',
        ageSex: '34F',
        language: 'English',
        slot: '11:30 AM',
        doctorName: 'Dr. Sunitha Rao',
        why: 'Prepaid ₹500 by UPI · attended 4 of 4',
        action: 'none',
        actionLabel: 'No action',
      },
    ],
    prepaidNote:
      'Prepaid bookings no-show 3.2% (n=312 this month) vs 11.8% unpaid (n=678).',
    consultationFee: '₹500',
  };
}

// The day calendar for Sat 18 Jul: [time, Dr. K. Ramesh's entry, Dr. Sunitha Rao's entry], where an
// entry is [token, patient, reason], 'free' or 'break'.
type Cell = [string, string, string] | 'free' | 'break';
const DAY: [string, Cell, Cell][] = [
  [
    '09:00',
    ['T-01', 'Ch. Lakshmi', 'Follow-up · fever, 3 days'],
    ['T-21', 'D. Anitha', 'Antenatal check · 18w'],
  ],
  [
    '09:30',
    ['T-02', 'Md. Rafi', 'New consult · chest pain'],
    ['T-22', 'S. Bhargavi', 'Follow-up · PCOS'],
  ],
  ['10:00', ['T-03', 'A. Srikanth', 'Review · lipid profile'], 'free'],
  [
    '10:30',
    ['T-04', 'P. Naveen', 'New consult · diabetes screen'],
    ['T-23', 'R. Vasanthi', 'New consult · irregular cycles'],
  ],
  [
    '11:00',
    ['T-05', 'Walk-in', 'General complaint'],
    ['T-24', 'K. Meenakshi', 'Post-natal review'],
  ],
  [
    '11:30',
    ['T-06', 'J. Ravindra', 'Follow-up · BP review'],
    ['T-25', 'N. Haritha', 'New consult · anemia in pregnancy'],
  ],
  ['12:00', 'break', ['T-26', 'V. Sunanda', 'Follow-up · 32w ANC']],
  ['12:30', ['T-07', 'G. Chandra Sekhar', 'Review · thyroid panel'], 'break'],
];

function entry(doctorId: string, time: string, cell: Cell): ScheduleEntry {
  const id = `${doctorId}-${time}`;
  if (cell === 'free') return { kind: 'free', id, doctorId, time };
  if (cell === 'break') return { kind: 'break', id, doctorId, time };
  const [token, patientName, reason] = cell;
  return { kind: 'booked', id, doctorId, time, token, patientName, reason };
}

export function seedSchedule(): DaySchedule {
  return {
    date: '18 Jul 2026',
    session: '09:00 AM – 01:00 PM · 2 of 4 doctors on floor this session',
    doctors: [DOCTORS[0], DOCTORS[2]].map((doctor) => ({ ...doctor })),
    times: DAY.map(([time]) => time),
    entries: DAY.flatMap(([time, ramesh, sunitha]) => [
      entry('dr-ramesh', time, ramesh),
      entry('dr-sunitha', time, sunitha),
    ]),
  };
}

export function seedRegistration(): RegistrationOverview {
  return {
    departments: [
      'General Medicine',
      'Gynecology',
      'Orthopedics',
      'Pediatrics',
    ],
    recent: [
      recent('Y. Padmavathi', '52F', 'Orthopedics', '09:12 AM', 'T-18'),
      recent('Baby of K. Ramana', '1F', 'Pediatrics', '08:58 AM', 'T-17'),
      recent('Mohd. Irfan', '32M', 'General Medicine', '08:41 AM', 'T-15'),
      recent('B. Srinu', '67M', 'Orthopedics', '08:30 AM', 'T-16'),
      recent('Padma Sree', '28F', 'Gynecology', '08:19 AM', 'T-14'),
    ],
  };
}

function recent(
  name: string,
  ageSex: string,
  department: RegistrationOverview['departments'][number],
  at: string,
  token: string,
): RegistrationOverview['recent'][number] {
  return {
    id: `reg-${token}`,
    name,
    ageSex,
    department,
    at,
    token,
    abhaLinked: false,
  };
}

// The master patient index, as far as the sample data goes: one number, one patient, one ABHA.
export const PHONE_DIRECTORY: Record<
  string,
  Omit<Extract<PhoneLookup, { kind: 'existing' }>, 'kind' | 'phone'>
> = {
  '9876543210': {
    name: 'Venkatesh Naidu',
    meta: '44M · hypertension',
    abha: '91-1234-5678-9012',
    lastVisit: 'last visit 02 Jul 2026',
  },
  '9849321574': {
    name: 'K. Yadamma',
    meta: '63F · T2DM review overdue',
    abha: '91-3308-1174-2260',
    lastVisit: 'last visit 04 Apr 2026',
  },
};

export const ABHA_SAMPLE = {
  abha: '91-7412-8890-3345',
  phone: '+91 90035 21467',
  name: 'N. Suvarna Kumari',
  ageSex: '34 / F',
  records: [
    {
      date: '14 Mar 2026',
      facility: 'Yashoda Hospital, Secunderabad',
      detail: 'CBC, Widal · results on file · 4 months old',
    },
    {
      date: '02 Jan 2026',
      facility: 'Apollo Clinic, Kukatpally',
      detail:
        'Consultation + Rx (Amoxicillin 500mg) · allergies: none recorded',
    },
    {
      date: '19 Nov 2025',
      facility: 'Govt. UPHC Kukatpally',
      detail: 'Immunisation record',
    },
  ],
};

export function seedReferrals(): ReferralsOverview {
  return {
    summary: '5 this week · 2 pending action',
    referrals: [
      {
        id: 'ref-apollo',
        source: 'Apollo Diagnostics',
        sourceDetail: 'Kukatpally',
        patientName: 'B. Srinu',
        ageSex: '67M',
        reason: 'Post-op knee review, X-ray attached',
        date: '16 Jul 2026',
        status: 'pending',
      },
      {
        id: 'ref-care',
        source: 'Dr. Anand Kumar',
        sourceDetail: 'Care Hospitals, Ortho — Banjara Hills',
        patientName: 'Y. Padmavathi',
        ageSex: '52F',
        reason: 'Chronic knee pain, seeking second opinion',
        date: '15 Jul 2026',
        status: 'accepted',
      },
      {
        id: 'ref-sunrise',
        source: 'Sunrise Clinic',
        sourceDetail: 'Miyapur',
        patientName: 'Mohd. Irfan',
        ageSex: '32M',
        reason: 'Suspected UTI — referred for lab workup',
        date: '14 Jul 2026',
        status: 'accepted',
      },
      {
        id: 'ref-kims',
        source: 'Dr. Y. Bhavani',
        sourceDetail: 'KIMS Hospitals, Kondapur',
        patientName: 'Padma Sree',
        ageSex: '28F',
        reason: 'High-risk pregnancy — joint consult requested',
        date: '13 Jul 2026',
        status: 'pending',
      },
      {
        id: 'ref-aarogya',
        source: 'Aarogya Nursing Home',
        sourceDetail: 'Nizampet',
        patientName: 'Venkatesh Naidu',
        ageSex: '44M',
        reason: 'Hypertension crisis — discharge follow-up',
        date: '11 Jul 2026',
        status: 'accepted',
      },
    ],
    replyDraft: {
      id: 'reply-apollo',
      referralId: 'ref-apollo',
      recipient: 'Apollo Diagnostics, Kukatpally',
      message:
        'Referral received — B. Srinu scheduled with Dr. P. Anil Kumar (Orthopedics) on 21 Jul 2026, 10:30 AM. X-ray and prior notes received, thank you.',
    },
  };
}
