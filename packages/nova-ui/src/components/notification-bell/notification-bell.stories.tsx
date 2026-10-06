import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { Surface } from '../../primitives/surface';
import { NotificationBell } from './notification-bell';

// The bell is the prototype's top bar icon button, drawn for the dark chrome, so it is shown on it.
const onChrome: Decorator = (Story) => (
  <Surface material="chrome" radius="md" className="inline-flex p-4">
    <Story />
  </Surface>
);

const meta = {
  title: 'Components/NotificationBell',
  component: NotificationBell,
  args: { count: 3 },
  decorators: [onChrome],
} satisfies Meta<typeof NotificationBell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unread: Story = {};
export const None: Story = { args: { count: 0 } };
export const Capped: Story = { args: { count: 250 } };

function Clearing() {
  const [count, setCount] = useState(5);
  return <NotificationBell count={count} onClick={() => setCount(0)} />;
}

export const ClearsOnOpen: Story = { render: () => <Clearing /> };
