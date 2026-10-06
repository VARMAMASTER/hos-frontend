import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiClassChip } from '../components/ai-class-chip/ai-class-chip';
import { TierCard } from '../components/ai-class-chip/tier-card';
import {
  AiDraftBlock,
  type AiDraftBlockProps,
} from '../components/ai-draft-block/ai-draft-block';
import { AiSourceLine } from '../components/ai-source-line/ai-source-line';
import { WhyTrail } from '../components/ai-source-line/why-trail';
import { Button } from '../components/button/button';

// The AI trust core in one place: the draft lifecycle, provenance and confidence, and the
// regulatory tier. Every patient and member of staff here is fictional. Flip the toolbar's scheme,
// theme and material, or open the Dark stories.
const meta = { title: 'AI/Trust core' } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const DARK = { scheme: 'dark' } as const;

const body = (
  <p className="text-[13px] leading-[1.62]">
    Admitted 12 Oct with a community-acquired chest infection, treated with IV
    ceftriaxone. Fever settled within 48 hours; discharged on oral amoxicillin.
  </p>
);

const STATES: Array<{ name: string } & Partial<AiDraftBlockProps>> = [
  { name: 'Generating', status: 'generating', progress: 60 },
  { name: 'Pending', status: 'pending' },
  {
    name: 'Approved',
    status: 'approved',
    approvedBy: 'Dr. Meera Iyer',
    approvedAt: '10:52 AM',
  },
  { name: 'Undone', status: 'undone' },
  {
    name: 'Rejected',
    status: 'rejected',
    rejectedBy: 'Dr. Meera Iyer',
    rejectionReason: 'Wrong discharge medication.',
  },
  {
    name: 'Blocked',
    status: 'blocked',
    blockedReason: 'No plan dictated yet. It cannot be signed until it is.',
  },
  {
    name: 'For signature',
    status: 'for-signature',
    approverName: 'Mary Grace',
    signatory: 'Dr. P. Anil Kumar',
  },
  {
    name: 'Witness',
    status: 'witness',
    firstSignature: 'Mary Grace',
    approverName: 'Sister Vasavi',
    signatory: 'Sister Vasavi',
  },
  {
    name: 'Gated',
    status: 'gated',
    gateLabel: 'Needs pharmacist sign-off',
    gateReason: 'Schedule H1: the counter cannot dispense without it.',
    approverName: 'Ravi Teja',
  },
];

function AllStatesGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {STATES.map(({ name, ...props }) => (
        <AiDraftBlock
          key={name}
          title={name}
          approverName="Dr. Meera Iyer"
          {...props}
        >
          {body}
        </AiDraftBlock>
      ))}
    </div>
  );
}

// Every state side by side. Each is held (controlled), so its buttons report but do not move it.
export const AllStates: Story = { render: () => <AllStatesGrid /> };
export const AllStatesDark: Story = {
  render: () => <AllStatesGrid />,
  globals: DARK,
};

// Approve, then Undo: the chip flips, the block settles green, the record and Undo appear and
// take the focus; Undo puts the draft back to pending and the focus back on Approve.
export const ApproveAndUndo: Story = {
  render: () => (
    <div className="max-w-2xl">
      <AiDraftBlock
        title="Discharge summary — S. Lakshmi, 62F"
        approverName="Dr. Meera Iyer"
        source={
          <AiSourceLine confidence="high">
            IPD chart (34 events) · lab results 12–16 Oct · eMAR
          </AiSourceLine>
        }
      >
        {body}
      </AiDraftBlock>
    </div>
  ),
};

// Reject asks why before it rejects: the reason field takes the focus, never a destructive button.
export const RejectWithReason: Story = {
  render: () => (
    <div className="max-w-2xl">
      <AiDraftBlock
        title="WhatsApp reply — appointment change"
        approverName="Swapna"
        verb="Send"
        onEdit={() => undefined}
      >
        <p className="text-[13px] leading-[1.62]">
          Namaskaram. Your review with the orthopaedic surgeon moves to Monday
          27 Jul at 10:30 AM, because the OPD is closed on Sunday.
        </p>
      </AiDraftBlock>
    </div>
  ),
};

function DischargeSummaryDraft() {
  return (
    <div className="max-w-2xl">
      <AiDraftBlock
        title="Discharge summary — K. Yadagiri, 58M"
        approverName="Dr. P. Anil Kumar"
        badges={<AiClassChip tier="green" detail="drafted from the record" />}
        source={
          <div className="flex flex-col gap-2">
            <AiSourceLine confidence="medium" eventHref="#discharge-events">
              Theatre log · anaesthesia chart · eMAR · lab results 18–22 Jul
            </AiSourceLine>
            <WhyTrail
              defaultOpen
              reasons={[
                'The follow-up date comes from the plan dictated at the ward round on 22 Jul.',
                'The serum sodium was read from a blurred scan, so it is marked for you to check.',
                'Nothing here was invented: every value is already in the record.',
              ]}
              sources="Ward round 22 Jul · scanned lab report (page 1) · eMAR"
            />
          </div>
        }
      >
        <div className="flex flex-col gap-2 text-[13px] leading-[1.62]">
          <p>
            Right total hip replacement on 18 Jul under spinal anaesthesia.
            Uneventful recovery; mobilising with a walker from day 2.
          </p>
          {/* A div, not a p: the source line is a paragraph of its own. */}
          <div>
            Serum sodium 138 mmol/L on 21 Jul.{' '}
            <AiSourceLine confidence="low" label="Read from" className="inline">
              scanned report, page 1, line 6
            </AiSourceLine>
          </div>
          <p>Review in Orthopaedics OPD on Monday 27 Jul, 10:30 AM.</p>
        </div>
      </AiDraftBlock>
    </div>
  );
}

// A discharge summary as a consultant sees it: the source line with its confidence, one value the
// model is unsure of, the Why trail open, and the tier chip in the header.
export const DischargeSummary: Story = {
  render: () => <DischargeSummaryDraft />,
};
export const DischargeSummaryDark: Story = {
  render: () => <DischargeSummaryDraft />,
  globals: DARK,
};

// The same operation note seen by the nurse who prepared it (no Sign button, it names who signs)
// and by the surgeon whose credential signs it.
export const DelegatedSignature: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      {(['Mary Grace', 'Dr. P. Anil Kumar'] as const).map((viewer) => (
        <AiDraftBlock
          key={viewer}
          title={`Operation note, as ${viewer} sees it`}
          defaultStatus="for-signature"
          approverName={viewer}
          signatory="Dr. P. Anil Kumar"
          badges={<AiClassChip tier="green" />}
        >
          <p className="text-[13px] leading-[1.62]">
            Wheels-in 09:02, incision 09:31, wheels-out 11:18. Three implants
            scanned from the trolley; no intra-operative events recorded.
          </p>
        </AiDraftBlock>
      ))}
    </div>
  ),
};

// A two-person control: the nurse who counted cannot also witness; a second nurse completes it.
export const TwoPersonWitness: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      {(['Mary Grace', 'Sister Vasavi'] as const).map((viewer) => (
        <AiDraftBlock
          key={viewer}
          title={`Schedule H1 count, as ${viewer} sees it`}
          defaultStatus="witness"
          firstSignature="Mary Grace"
          approverName={viewer}
          signatory={viewer === 'Sister Vasavi' ? viewer : undefined}
          source={
            <AiSourceLine>
              Ward Schedule H1 register · physical count at 10:40
            </AiSourceLine>
          }
          actions={
            <Button variant="ghost" size="sm">
              Counts disagree — record both
            </Button>
          }
        >
          <p className="text-[13px] leading-[1.62]">
            The physical count matches the register on both lines. Counted by
            Mary Grace at 10:40.
          </p>
        </AiDraftBlock>
      ))}
    </div>
  ),
};

function Tiers() {
  return (
    <div className="grid max-w-4xl gap-4 md:grid-cols-3">
      <TierCard
        tier="green"
        title="Discharge Drafter"
        detail="productivity"
        description="Drafts only. A human always signs."
      />
      <TierCard
        tier="amber"
        title="Lab Summarizer"
        detail="reference"
        description="Quotes the record and published ranges. Never tells you what to do."
      />
      <TierCard
        tier="red"
        title="Deterioration forecast"
        detail="medical device"
        description="Predicts a future clinical event. Not licensed in HOS."
        reason="Needs a CDSCO Class C licence, an ICMR ethics review and separate DPDP consent."
      />
    </div>
  );
}

// The three tiers. RED is never a control; "Why blocked" explains it from the keyboard.
export const TierCards: Story = { render: () => <Tiers /> };
export const TierCardsDark: Story = { render: () => <Tiers />, globals: DARK };
