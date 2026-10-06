import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline, type TimelineItem } from './timeline';

// A fixed "now" and zone, so the relative times and day headings in every story read the same on any
// machine and any day. Real screens leave both off.
const NOW = '2026-10-06T16:30:00+05:30';
const ZONE = 'Asia/Kolkata';

const meta = {
  title: 'Components/Timeline',
  component: Timeline,
  args: {
    'aria-label': 'Event history',
    now: NOW,
    timeZone: ZONE,
    items: [],
  },
  argTypes: {
    density: { control: 'inline-radio', options: ['comfortable', 'compact'] },
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

const journey: TimelineItem[] = [
  {
    id: 'discharge',
    at: '2026-10-06T15:40:00+05:30',
    title: 'Discharged home',
    description: 'Follow-up booked for 13 Oct with Dr. Meera Iyer',
    tone: 'good',
    actor: { name: 'Sister Anita', role: 'Ward 4B', avatar: true },
  },
  {
    id: 'approved',
    at: '2026-10-06T14:05:00+05:30',
    title: 'Discharge summary approved',
    description: 'The AI draft was approved without changes',
    tone: 'good',
    actor: { name: 'Dr. Meera Iyer', role: 'Consultant', avatar: true },
  },
  {
    id: 'summary',
    at: '2026-10-06T13:20:00+05:30',
    title: 'Discharge summary drafted',
    description: 'Awaiting clinician review',
    tone: 'ai',
    details: (
      <p>
        Admitted with a lower respiratory tract infection. Responded to oral
        antibiotics within 48 hours; afebrile since 4 Oct. Chest X-ray clear.
        Advised rest, fluids and the full course of antibiotics.
      </p>
    ),
  },
  {
    id: 'potassium',
    at: '2026-10-05T09:40:00+05:30',
    title: 'Potassium flagged high',
    description: '5.6 mmol/L, recheck ordered',
    tone: 'warn',
    details: (
      <p>
        Recheck at 14:00 was 4.9 mmol/L. No treatment needed; the first sample
        was haemolysed.
      </p>
    ),
  },
  {
    id: 'labs',
    at: '2026-10-04T18:10:00+05:30',
    title: 'Labs resulted',
    description: 'CBC, CRP and electrolytes',
    tone: 'info',
    actor: { name: 'Lab desk', role: 'Pathology' },
    details: (
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt>CRP</dt>
        <dd className="font-mono">42 mg/L</dd>
        <dt>WBC</dt>
        <dd className="font-mono">13.1 x10^9/L</dd>
        <dt>Potassium</dt>
        <dd className="font-mono">5.6 mmol/L</dd>
      </dl>
    ),
  },
  {
    id: 'admission',
    at: '2026-10-04T09:02:00+05:30',
    title: 'Admitted via emergency',
    description: 'Ward 4B, bed 12',
    actor: { name: 'Dr. Ravi Kumar', role: 'Casualty officer', avatar: true },
  },
];

// admission, labs, the AI summary, its approval and the discharge, newest first, grouped by day.
// Every node has its own glyph and each toned event says its tone in words, so none of it is colour
// alone. Open "Details" on an event; the line runs unbroken between the days.
export const PatientJourney: Story = {
  args: { items: journey, groupByDay: true },
};

// The same history without day headings: each time carries its own date.
export const PatientJourneyUngrouped: Story = {
  args: { items: journey },
};

const staff = ['Asha Rao', 'Ravi Kumar', 'Meera Iyer', 'System'];
const actions: [string, TimelineItem['tone']][] = [
  ['Opened the patient record', undefined],
  ['Viewed lab results', undefined],
  ['Updated the medication list', 'info'],
  ['Exported the discharge summary', 'warn'],
  ['Signed an order', 'good'],
  ['Failed sign-in attempt', 'crit'],
  ['Approved an AI draft', 'ai'],
];

const audit: TimelineItem[] = Array.from({ length: 14 }, (_, index) => {
  const [title, tone] = actions[index % actions.length] ??
    actions[0] ?? ['', undefined];
  const minutes = 6 + index * 47;
  return {
    id: `audit-${index}`,
    at: new Date(Date.parse(NOW) - minutes * 60_000),
    title,
    tone,
    actor: { name: staff[index % staff.length] ?? 'System' },
  };
});

// Compact rows, text-only actors, many events: a record of who did what.
export const DenseAuditLog: Story = {
  args: { items: audit, density: 'compact', groupByDay: true },
};

export const AllTones: Story = {
  args: {
    items: [
      {
        id: 'neutral',
        at: '2026-10-06T16:20:00+05:30',
        title: 'Neutral event',
      },
      {
        id: 'good',
        at: '2026-10-06T16:10:00+05:30',
        title: 'Good event',
        tone: 'good',
      },
      {
        id: 'warn',
        at: '2026-10-06T16:00:00+05:30',
        title: 'Warning event',
        tone: 'warn',
      },
      {
        id: 'crit',
        at: '2026-10-06T15:50:00+05:30',
        title: 'Critical event',
        tone: 'crit',
      },
      {
        id: 'info',
        at: '2026-10-06T15:40:00+05:30',
        title: 'Information event',
        tone: 'info',
      },
      {
        id: 'ai',
        at: '2026-10-06T15:30:00+05:30',
        title: 'AI event',
        tone: 'ai',
      },
    ],
  },
};

// Legacy callers keep working: `time` is rendered as given and there is no `at`.
export const PlainTimes: Story = {
  args: {
    items: [
      {
        id: 'a',
        time: '14 Oct, 11:20',
        title: 'Discharge summary drafted',
        tone: 'ai',
      },
      {
        id: 'b',
        time: '14 Oct, 09:40',
        title: 'Potassium flagged critical',
        tone: 'crit',
      },
      { id: 'c', time: '11 Oct, 09:02', title: 'Admitted via emergency' },
    ],
  },
};

// A motion-safe skeleton while the events load. It is a status region marked busy.
export const Loading: Story = {
  args: { loading: true, skeletonCount: 4 },
};

export const Empty: Story = {
  args: { items: [] },
};

export const CustomEmpty: Story = {
  args: {
    items: [],
    empty: (
      <p className="text-[13px] text-ink-2">
        Nothing has been recorded for this stay yet.
      </p>
    ),
  },
};
