import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiSourceLine } from '../ai-source-line/ai-source-line';
import { Button } from '../button/button';
import { AiDraftBlock } from './ai-draft-block';

// Fictional patients and staff throughout.
const meta = {
  title: 'AI/AiDraftBlock',
  component: AiDraftBlock,
  args: {
    title: 'Discharge summary — S. Lakshmi, 62F',
    approverName: 'Dr. Meera Iyer',
    children: (
      <p className="text-control leading-relaxed">
        Admitted 12 Oct with a community-acquired chest infection and treated
        with IV ceftriaxone. Fever settled within 48 hours. Potassium was 5.6 on
        14 Oct and 4.6 on recheck. Discharged on oral amoxicillin for five days.
      </p>
    ),
    source: (
      <AiSourceLine confidence="high">
        IPD chart (34 events) · lab results 12–16 Oct · eMAR
      </AiSourceLine>
    ),
  },
} satisfies Meta<typeof AiDraftBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

// Pending: the gradient rail, the spark, "AI draft" and "Draft — awaiting approval". Press Approve,
// then Undo; or Reject, which asks for a reason first.
export const Pending: Story = {};

export const Generating: Story = {
  args: { status: 'generating', progress: 40, source: undefined },
};

export const Approved: Story = {
  args: {
    status: 'approved',
    approvedBy: 'Dr. Meera Iyer',
    approvedAt: '10:52 AM',
  },
};

export const Rejected: Story = {
  args: {
    status: 'rejected',
    rejectedBy: 'Dr. Meera Iyer',
    rejectionReason:
      'Wrong discharge medication: she is allergic to penicillin.',
  },
};

export const Blocked: Story = {
  args: {
    title: 'AI SOAP draft',
    status: 'blocked',
    blockedReason:
      'No plan dictated yet. The Scribe never writes a plan; the note cannot be signed until you dictate one.',
    actions: (
      <Button variant="ai" size="sm">
        Dictate the plan
      </Button>
    ),
    source: undefined,
  },
};

export const ForSignature: Story = {
  args: {
    title: 'Operation note — total hip replacement',
    status: 'for-signature',
    approverName: 'Mary Grace',
    signatory: 'Dr. P. Anil Kumar',
  },
};

export const Witness: Story = {
  args: {
    title: 'Schedule H1 count — Ward 3',
    defaultStatus: 'witness',
    firstSignature: 'Mary Grace',
    approverName: 'Sister Vasavi',
    signatory: 'Sister Vasavi',
  },
};

export const Gated: Story = {
  args: {
    title: 'Discount above counter authority',
    status: 'gated',
    gateLabel: 'Needs owner sign-off',
    gateReason:
      'A 15% discount is ₹840; the counter can authorise up to ₹500 on this bill.',
    approverName: 'Ravi Teja',
    signatory: 'Dr. G. Prakash',
    spark: '₹',
    source: undefined,
  },
};
