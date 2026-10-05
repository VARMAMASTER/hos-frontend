import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ApprovalBar } from './approval-bar';

const meta = {
  title: 'AI/ApprovalBar',
  component: ApprovalBar,
  args: {
    onApprove: () => undefined,
    onEdit: () => undefined,
    onReject: () => undefined,
  },
} satisfies Meta<typeof ApprovalBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {};

export const ApproveOnly: Story = {
  args: { onEdit: undefined, onReject: undefined },
};

// While a decision is being submitted every control is disabled and the group is aria-busy.
export const Busy: Story = { args: { busy: true } };

// Once approved, the controls give way to a record of who approved.
export const Approved: Story = { args: { approvedBy: 'Dr. Meera Iyer' } };

function ReviewFlow() {
  const [phase, setPhase] = useState<'pending' | 'busy' | 'approved'>(
    'pending',
  );
  useEffect(() => {
    if (phase !== 'busy') return;
    const timer = setTimeout(() => setPhase('approved'), 900);
    return () => clearTimeout(timer);
  }, [phase]);
  return (
    <ApprovalBar
      busy={phase === 'busy'}
      approvedBy={phase === 'approved' ? 'Dr. Meera Iyer' : undefined}
      onApprove={() => setPhase('busy')}
      onEdit={() => setPhase('pending')}
      onReject={() => setPhase('pending')}
    />
  );
}

// Press Approve: the bar goes busy, then shows who approved.
export const Interactive: Story = { render: () => <ReviewFlow /> };
