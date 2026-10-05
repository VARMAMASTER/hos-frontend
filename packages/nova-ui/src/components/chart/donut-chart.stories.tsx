import type { Meta, StoryObj } from '@storybook/react-vite';
import { DonutChart } from './donut-chart';

const meta = {
  title: 'Charts/DonutChart',
  component: DonutChart,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DonutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PayerMix: Story = {
  args: {
    ariaLabel: 'Payer mix',
    description: 'Share of patients by payer. Insurance is the largest.',
    data: [
      { payer: 'Insurance', patients: 120 },
      { payer: 'Government scheme', patients: 80 },
      { payer: 'Corporate', patients: 46 },
      { payer: 'Self pay', patients: 40 },
    ],
    config: {
      Insurance: { label: 'Insurance', color: 'chart-1' },
      'Government scheme': { label: 'Government scheme', color: 'chart-2' },
      Corporate: { label: 'Corporate', color: 'chart-3' },
      'Self pay': { label: 'Self pay', color: 'chart-4' },
    },
    categoryKey: 'payer',
    valueKey: 'patients',
    totalLabel: 'Patients',
  },
};
