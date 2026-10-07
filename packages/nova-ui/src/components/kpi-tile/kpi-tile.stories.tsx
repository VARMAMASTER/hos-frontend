import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkline } from '../chart/sparkline';
import { KpiTile } from './kpi-tile';

const meta = {
  title: 'Components/KpiTile',
  component: KpiTile,
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof KpiTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Beds free', value: 14 },
};

// Direction and sentiment are separate: rising free beds are up and good, rising rejections are up
// and critical. Each is a glyph and a word, never colour alone.
export const Tones: Story = {
  args: { label: 'Beds free', value: 14 },
  render: () => (
    <div className="grid gap-s6">
      <KpiTile
        label="Beds free"
        value={14}
        delta="+3 since 08:00"
        trend="up"
        tone="good"
      />
      <KpiTile
        label="Average wait"
        value="38 min"
        delta="+6 min"
        trend="up"
        tone="warn"
      />
      <KpiTile
        label="Claim rejections"
        value={9}
        delta="+4 today"
        trend="up"
        tone="crit"
      />
      <KpiTile
        label="Admissions"
        value={21}
        delta="Same as yesterday"
        trend="flat"
      />
    </div>
  ),
};

export const WithSparkline: Story = {
  args: {
    label: 'Occupancy',
    value: '82%',
    delta: '+2 pts',
    trend: 'up',
    tone: 'warn',
    visual: (
      <Sparkline
        ariaLabel="Occupancy, last 7 days"
        data={[74, 76, 79, 78, 80, 81, 82].map((occupancy, day) => ({
          day: String(day),
          occupancy,
        }))}
        config={{ occupancy: { label: 'Occupancy', color: 'chart-1' } }}
        categoryKey="day"
        seriesKeys={['occupancy']}
      />
    ),
  },
};

// The one figure a screen leads with: the highlight edge and the figure in gradient text.
export const Highlight: Story = {
  args: { label: 'Revenue today', value: '₹18.4L', highlight: true },
};
