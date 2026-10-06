import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AlgorithmChangeGate,
  type ChangeGateCheck,
} from './algorithm-change-gate';

const GREEN: ChangeGateCheck[] = [
  {
    id: 'g1',
    name: 'Code-switched dictation · 240 synthetic cases',
    result: '97.1%',
    threshold: '≥ 95%',
    status: 'pass',
  },
  {
    id: 'g2',
    name: 'Drug names vs licensed formulary · 180 cases',
    result: '99.2%',
    threshold: '≥ 99%',
    status: 'pass',
  },
  {
    id: 'g3',
    name: 'Dose and numeric transcription · 150 cases',
    result: '98.8%',
    threshold: '≥ 98%',
    status: 'pass',
  },
  {
    id: 'g4',
    name: 'Unsupported-claim probe · 200 adversarial cases',
    result: '0.3%',
    threshold: '≤ 0.5%',
    status: 'pass',
  },
];

const FAILING: ChangeGateCheck[] = [
  ...GREEN.slice(0, 3),
  {
    id: 'g5',
    name: 'Negation handling ("no chest pain") · 120 cases',
    result: '86.0%',
    threshold: '≥ 95%',
    status: 'fail',
    failure:
      '17 of 120 cases charted a negated symptom as present; 11 of them in Telugu–English code-switched dictation.',
  },
  GREEN[3]!,
];

const STEPS = [
  'Generating 180 synthetic consultations — no tenant records touched',
  'Replaying the v4.2 approve-as-is baseline',
  'Scoring v4.3 against the baseline',
  'Signing results into the control-plane chain',
];

const meta = {
  title: 'AI/AlgorithmChangeGate',
  component: AlgorithmChangeGate,
  args: {
    title: 'AI Scribe v4.2 → v4.3',
    description:
      'Prompt and retrieval change. The suites run on generated cases, never on a hospital’s records.',
    checks: FAILING,
    promoteLabel: 'Promote to canary',
    actor: 'Dr. G. Prakash',
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AlgorithmChangeGate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneFailing: Story = {};

export const AllPassing: Story = { args: { checks: GREEN } };

// Run the suite: the last check runs with the harness's steps, then passes and Promote unlocks.
export const RunTheSuite: Story = {
  render: (args) => <Run {...args} />,
};

function Run(args: Story['args']) {
  const [step, setStep] = useState<number | null>(null);
  const done = step !== null && step >= STEPS.length;
  const last: ChangeGateCheck = {
    id: 'g6',
    name: 'Regression vs v4.2 approve-as-is baseline',
    threshold: 'no drop',
    status: done ? 'pass' : step === null ? 'not-run' : 'running',
    result: done ? '+1.9 pts' : undefined,
  };
  function run() {
    setStep(0);
    STEPS.forEach((_, index) =>
      setTimeout(() => setStep(index + 1), (index + 1) * 700),
    );
  }
  return (
    <AlgorithmChangeGate
      title="AI Scribe v4.2 → v4.3"
      actor="Dr. G. Prakash"
      promoteLabel="Promote to canary"
      {...args}
      checks={[...GREEN, last]}
      progressSteps={STEPS}
      progressIndex={step ?? undefined}
      onRun={step === null ? run : undefined}
    />
  );
}
