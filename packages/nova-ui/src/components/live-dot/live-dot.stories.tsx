import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardBody, CardHeader } from '../card/card';
import { LiveDot } from './live-dot';

const meta = {
  title: 'Components/LiveDot',
  component: LiveDot,
  args: { label: 'Live' },
  argTypes: {
    tone: {
      control: 'select',
      options: ['good', 'warn', 'crit', 'info', 'neutral'],
    },
    pulse: { control: 'select', options: [false, true, 'slow', 'fast'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A standalone "this data is arriving live" indicator: a heartbeat dot and an optional label. It is a status region, so it needs a name: a visible `label`, or an `aria-label` for a bare dot. Motion-safe: under prefers-reduced-motion the dot is still. Use one per surface, for live or urgent data only.',
      },
    },
  },
} satisfies Meta<typeof LiveDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Fast: Story = {
  args: { tone: 'crit', label: 'Recording', pulse: 'fast' },
};

// A dot with no visible label still names itself for assistive technology.
export const BareDot: Story = {
  args: { label: undefined, 'aria-label': 'Live vitals feed' },
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <LiveDot tone="good" label="Live" />
      <LiveDot tone="warn" label="Delayed" />
      <LiveDot tone="crit" label="Recording" pulse="fast" />
      <LiveDot tone="info" label="Syncing" />
      <LiveDot tone="neutral" label="Offline" pulse={false} />
    </div>
  ),
};

// The common place for it: the title row of a card showing a live feed.
export const InACardHeader: Story = {
  render: () => (
    <Card className="max-w-xl">
      <CardHeader
        title="ICU vitals"
        description="Bed 4A, refreshed every second"
        actions={<LiveDot label="Live" />}
      />
      <CardBody className="grid grid-cols-3 gap-3 text-[13.5px]">
        <div>
          <div className="text-[12.5px] text-ink-2">Heart rate</div>
          <div className="text-[17px] font-semibold">82 bpm</div>
        </div>
        <div>
          <div className="text-[12.5px] text-ink-2">SpO2</div>
          <div className="text-[17px] font-semibold">97%</div>
        </div>
        <div>
          <div className="text-[12.5px] text-ink-2">BP</div>
          <div className="text-[17px] font-semibold">118/76</div>
        </div>
      </CardBody>
    </Card>
  ),
};
