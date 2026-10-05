import type { Meta, StoryObj } from '@storybook/react-vite';
import { KpiTile } from '../kpi-tile/kpi-tile';
import { Sparkline } from './sparkline';

const meta = {
  title: 'Charts/Sparkline',
  component: Sparkline,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
  ariaLabel: 'Collections over the last 7 days',
  data: [
    { day: 'Mon', collections: 3.1 },
    { day: 'Tue', collections: 3.6 },
    { day: 'Wed', collections: 3.4 },
    { day: 'Thu', collections: 3.9 },
    { day: 'Fri', collections: 4.0 },
    { day: 'Sat', collections: 3.7 },
    { day: 'Sun', collections: 4.2 },
  ],
  config: { collections: { label: 'Collections (lakhs)', color: 'chart-1' } },
  categoryKey: 'day',
  seriesKeys: ['collections'],
} satisfies Story['args'];

export const Inline: Story = { args: { ...args, className: 'w-40' } };

// In the KpiTile's visual slot. The tile is already an opaque data surface; the sparkline brings
// none of its own.
export const BesideAKpiValue: Story = {
  args,
  render: (props) => (
    <KpiTile
      className="max-w-xs"
      label="Collections today"
      value="₹4.2L"
      delta="12% vs last week"
      trend="up"
      tone="good"
      visual={<Sparkline {...props} height={44} />}
    />
  ),
};
