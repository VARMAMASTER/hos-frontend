import type { Meta, StoryObj } from '@storybook/react-vite';
import { LineChart } from './line-chart';

const meta = {
  title: 'Charts/LineChart',
  component: LineChart,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const week = [
  { day: 'Mon', admissions: 42, discharges: 38 },
  { day: 'Tue', admissions: 51, discharges: 40 },
  { day: 'Wed', admissions: 47, discharges: 55 },
  { day: 'Thu', admissions: 58, discharges: 49 },
  { day: 'Fri', admissions: 53, discharges: 57 },
  { day: 'Sat', admissions: 36, discharges: 44 },
  { day: 'Sun', admissions: 31, discharges: 35 },
];

export const AdmissionsAndDischarges: Story = {
  args: {
    ariaLabel: 'Admissions and discharges this week',
    description:
      'Daily admissions and discharges. Admissions peak on Thursday.',
    data: week,
    config: {
      admissions: { label: 'Admissions', color: 'chart-1' },
      discharges: { label: 'Discharges', color: 'chart-3' },
    },
    categoryKey: 'day',
    seriesKeys: ['admissions', 'discharges'],
  },
};

export const SingleSeries: Story = {
  args: {
    ariaLabel: 'Admissions this week',
    data: week,
    config: { admissions: { label: 'Admissions', color: 'chart-1' } },
    categoryKey: 'day',
    seriesKeys: ['admissions'],
  },
};
