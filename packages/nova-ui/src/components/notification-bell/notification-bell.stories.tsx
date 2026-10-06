import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotificationBell } from './notification-bell';

const meta = {
  title: 'Components/NotificationBell',
  component: NotificationBell,
  args: { count: 3 },
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
