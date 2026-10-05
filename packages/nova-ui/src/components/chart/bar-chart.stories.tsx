import type { Meta, StoryObj } from '@storybook/react-vite';
import { BarChart } from './bar-chart';

const meta = {
  title: 'Charts/BarChart',
  component: BarChart,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const wards = [
  { ward: 'ICU', occupied: 18, free: 2 },
  { ward: 'General', occupied: 54, free: 16 },
  { ward: 'Maternity', occupied: 21, free: 9 },
  { ward: 'Paediatrics', occupied: 17, free: 13 },
  { ward: 'Orthopaedics', occupied: 26, free: 4 },
];

const config = {
  occupied: { label: 'Occupied', color: 'chart-1' },
  free: { label: 'Free', color: 'chart-2' },
};

export const Columns: Story = {
  args: {
    ariaLabel: 'Beds by ward',
    description: 'Occupied and free beds in each ward. General has the most.',
    data: wards,
    config,
    categoryKey: 'ward',
    seriesKeys: ['occupied', 'free'],
  },
};

export const Stacked: Story = {
  args: { ...Columns.args, ariaLabel: 'Bed occupancy by ward', stacked: true },
};

export const Horizontal: Story = {
  args: {
    ...Columns.args,
    ariaLabel: 'Beds by ward, horizontal',
    orientation: 'horizontal',
    stacked: true,
    height: 280,
  },
};

export const SingleSeries: Story = {
  args: {
    ariaLabel: 'Occupied beds by ward',
    data: wards,
    config: { occupied: config.occupied },
    categoryKey: 'ward',
    seriesKeys: ['occupied'],
  },
};
