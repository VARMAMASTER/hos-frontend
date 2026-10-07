import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../avatar/avatar';
import { Card, CardBody, CardHeader } from '../card/card';
import { NovaThemeProvider } from '../../theme/theme-provider';
import { StatusDot, type StatusDotTone } from './status-dot';

const meta = {
  title: 'Components/StatusDot',
  component: StatusDot,
  args: { tone: 'good', label: 'Stable' },
  argTypes: {
    pulse: { control: 'select', options: [false, true, 'slow', 'fast'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A status is always its label: the dot only repeats it, so it is hidden from assistive technology. `pulse` adds a heartbeat (a soft ring that expands and fades, and a two-beat lub-dub on the dot) for LIVE or URGENT states only: a critical alert, a patient monitored live, a queue that is active. It is motion-safe, so under prefers-reduced-motion the dot is still and the state stays visible. Never use it to be the only signal, and never on many rows at once: when everything pulses nothing stands out.',
      },
    },
  },
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pulsing: Story = {
  args: { tone: 'crit', label: 'Critical', pulse: true },
};

// The label is mandatory: a bare coloured dot fails for colour-blind users and in greyscale print.
export const AllTones: Story = {
  render: () => (
    <div className="flex flex-col gap-s3">
      <StatusDot tone="good" label="Stable" />
      <StatusDot tone="warn" label="Under observation" />
      <StatusDot tone="crit" label="Critical" />
      <StatusDot tone="info" label="Awaiting review" />
      <StatusDot tone="neutral" label="Discharged" />
    </div>
  ),
};

const tones: { tone: StatusDotTone; label: string }[] = [
  { tone: 'good', label: 'Stable' },
  { tone: 'warn', label: 'Under observation' },
  { tone: 'crit', label: 'Critical' },
  { tone: 'info', label: 'Awaiting review' },
  { tone: 'neutral', label: 'Discharged' },
];

const pulses = [
  { name: 'Off', pulse: false },
  { name: 'On', pulse: true },
  { name: 'Slow', pulse: 'slow' },
  { name: 'Fast', pulse: 'fast' },
] as const;

function PulseGrid() {
  return (
    <div className="grid w-fit grid-cols-[auto_repeat(4,max-content)] items-center gap-x-s9 gap-y-s5">
      <span />
      {pulses.map(({ name }) => (
        <span key={name} className="text-label font-semibold text-ink-2">
          pulse: {name}
        </span>
      ))}
      {tones.map(({ tone, label }) => (
        <div key={tone} className="contents">
          <span className="text-label text-ink-3">{tone}</span>
          {pulses.map(({ name, pulse }) => (
            <StatusDot key={name} tone={tone} label={label} pulse={pulse} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Every tone with pulse off, on, slow and fast, in both schemes at once whatever the toolbar says.
// Emulate prefers-reduced-motion in the browser's devtools to see every dot go still.
export const PulseSpeedsLightAndDark: Story = {
  render: () => (
    <div className="flex flex-col gap-s6">
      {(['light', 'dark'] as const).map((scheme) => (
        <NovaThemeProvider
          key={scheme}
          scheme={scheme}
          className="nova-canvas rounded-overlay p-s8 text-ink"
        >
          <p className="mb-s5 text-label font-semibold uppercase tracking-eyebrow text-ink-2">
            {scheme}
          </p>
          <PulseGrid />
        </NovaThemeProvider>
      ))}
    </div>
  ),
};

const queue = [
  {
    name: 'Ramesh Kumar',
    detail: 'Bed 4A · chest pain',
    tone: 'crit',
    label: 'Critical',
    pulse: 'fast',
  },
  {
    name: 'Anita Rao',
    detail: 'Bed 2C · post-op monitoring',
    tone: 'warn',
    label: 'Monitored live',
    pulse: true,
  },
  {
    name: 'Suresh Patel',
    detail: 'Bed 7B · awaiting labs',
    tone: 'info',
    label: 'Awaiting review',
    pulse: false,
  },
  {
    name: 'Meena Iyer',
    detail: 'Bed 1A · recovering',
    tone: 'good',
    label: 'Stable',
    pulse: false,
  },
  {
    name: 'Lakshmi Devi',
    detail: 'Bed 9D · discharged 08:40',
    tone: 'neutral',
    label: 'Discharged',
    pulse: false,
  },
] as const;

// Pulse is for the rows that need eyes now. Here one is critical and one is on live monitoring; the
// three that are not urgent stay still, so the two that matter stand out.
export const LiveQueue: Story = {
  render: () => (
    <Card className="max-w-xl">
      <CardHeader title="Ward 4B queue" description="Most urgent first" />
      <CardBody className="p-0">
        <ul className="divide-y divide-border">
          {queue.map((patient) => (
            <li
              key={patient.name}
              className="flex items-center gap-s5 px-s6 py-s4"
            >
              <Avatar name={patient.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-input font-semibold">{patient.name}</div>
                <div className="text-body-sm text-ink-2">{patient.detail}</div>
              </div>
              <StatusDot
                tone={patient.tone}
                label={patient.label}
                pulse={patient.pulse}
              />
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  ),
};
