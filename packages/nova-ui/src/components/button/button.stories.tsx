import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Approve draft' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Outline: Story = { args: { variant: 'outline' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Ai: Story = { args: { variant: 'ai', children: 'Draft with AI' } };
export const Small: Story = { args: { size: 'sm' } };
export const Disabled: Story = { args: { disabled: true } };
export const Danger: Story = {
  args: { variant: 'danger', children: 'Cancel admission' },
};
export const Loading: Story = { args: { loading: true, children: 'Saving' } };
export const FullWidth: Story = {
  args: { fullWidth: true, children: 'Sign in' },
  render: (args) => (
    <div className="max-w-sm">
      <Button {...args} />
    </div>
  ),
};

// Every variant side by side, as the prototype's .btn family: a 13px semibold label, an 8px radius,
// flat fills, shadow-md on hover.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-s5">
      <Button>Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ai">Draft with AI</Button>
      <Button size="sm">Small</Button>
      <Button loading>Saving</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};
