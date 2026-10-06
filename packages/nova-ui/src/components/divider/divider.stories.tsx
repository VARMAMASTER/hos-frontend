import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './divider';

const meta = {
  title: 'Components/Divider',
  component: Divider,
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="max-w-md space-y-3 text-[13px] text-ink">
      <p>Admission details</p>
      <Divider />
      <p>Billing details</p>
    </div>
  ),
};

export const Labelled: Story = {
  render: () => (
    <div className="max-w-md space-y-3 text-[13px] text-ink">
      <p>Bed 4 vacated</p>
      <Divider label="Yesterday" />
      <p>Discharge summary filed</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-16 items-center gap-4 text-[13px] text-ink">
      <span>Ward A</span>
      <Divider orientation="vertical" />
      <span>Ward B</span>
      <Divider orientation="vertical" label="or" />
      <span>Ward C</span>
    </div>
  ),
};

export const Decorative: Story = {
  name: 'Decorative (hidden from screen readers)',
  render: () => (
    <div className="max-w-md space-y-3 text-[13px] text-ink">
      <p>Purely visual rules carry no meaning, so they are not announced.</p>
      <Divider decorative />
      <p>Use the plain form when the rule really separates sections.</p>
    </div>
  ),
};
