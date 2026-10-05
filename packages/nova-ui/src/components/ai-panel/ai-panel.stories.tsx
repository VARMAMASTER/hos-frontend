import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ApprovalBar } from '../approval-bar/approval-bar';
import { AiPanel } from './ai-panel';

const meta = {
  title: 'AI/AiPanel',
  component: AiPanel,
  args: {
    title: 'Discharge summary',
    children: (
      <p>
        Admitted with a chest infection and treated with intravenous
        antibiotics. Fever settled within 48 hours. Potassium was high on 14 Oct
        and has been rechecked.
      </p>
    ),
  },
} satisfies Meta<typeof AiPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Draft: the ai-toned rail, the ✦ AI draft badge, and an ApprovalBar in the footer.
export const Draft: Story = {
  args: {
    footer: (
      <ApprovalBar
        onApprove={() => undefined}
        onEdit={() => undefined}
        onReject={() => undefined}
      />
    ),
  },
};

// Approved: the draft styling is dropped and the panel says so in words, not only in colour. The
// badge stays, because a machine still wrote it.
export const Approved: Story = {
  args: {
    state: 'approved',
    footer: (
      <ApprovalBar onApprove={() => undefined} approvedBy="Dr. Meera Iyer" />
    ),
  },
};

export const WithoutFooter: Story = {};

function ReviewFlow() {
  const [phase, setPhase] = useState<'draft' | 'busy' | 'approved'>('draft');
  useEffect(() => {
    if (phase !== 'busy') return;
    const timer = setTimeout(() => setPhase('approved'), 900);
    return () => clearTimeout(timer);
  }, [phase]);
  return (
    <AiPanel
      title="Discharge summary"
      state={phase === 'approved' ? 'approved' : 'draft'}
      footer={
        <ApprovalBar
          busy={phase === 'busy'}
          approvedBy={phase === 'approved' ? 'Dr. Meera Iyer' : undefined}
          onApprove={() => setPhase('busy')}
          onEdit={() => setPhase('draft')}
          onReject={() => setPhase('draft')}
        />
      }
    >
      <p>
        Admitted with a chest infection and treated with intravenous
        antibiotics. Fever settled within 48 hours. Potassium was high on 14 Oct
        and has been rechecked.
      </p>
    </AiPanel>
  );
}

// Press Approve: the panel goes busy, then flips from draft to approved.
export const Interactive: Story = {
  render: () => <ReviewFlow />,
};
