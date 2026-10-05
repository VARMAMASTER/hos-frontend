import type { Meta, StoryObj } from '@storybook/react-vite';
import { AreaChart } from './area-chart';

const meta = {
  title: 'Charts/AreaChart',
  component: AreaChart,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof AreaChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const collections = [
  { month: 'Apr', opd: 310, ipd: 820, pharmacy: 190 },
  { month: 'May', opd: 335, ipd: 860, pharmacy: 205 },
  { month: 'Jun', opd: 322, ipd: 905, pharmacy: 214 },
  { month: 'Jul', opd: 360, ipd: 940, pharmacy: 228 },
  { month: 'Aug', opd: 381, ipd: 972, pharmacy: 240 },
  { month: 'Sep', opd: 402, ipd: 1010, pharmacy: 251 },
];

const config = {
  opd: { label: 'OPD', color: 'chart-1' },
  ipd: { label: 'IPD', color: 'chart-3' },
  pharmacy: { label: 'Pharmacy', color: 'chart-5' },
};

export const Stacked: Story = {
  args: {
    ariaLabel: 'Collections by department, lakhs of rupees',
    description:
      'Monthly collections stacked by department; IPD is the largest.',
    data: collections,
    config,
    categoryKey: 'month',
    seriesKeys: ['opd', 'ipd', 'pharmacy'],
    stacked: true,
  },
};

export const SingleSeries: Story = {
  args: {
    ariaLabel: 'IPD collections, lakhs of rupees',
    data: collections,
    config: { ipd: config.ipd },
    categoryKey: 'month',
    seriesKeys: ['ipd'],
  },
};
