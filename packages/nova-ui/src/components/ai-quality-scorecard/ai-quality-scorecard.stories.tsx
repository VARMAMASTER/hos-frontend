import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiButton } from '../ai-button/ai-button';
import {
  AiQualityScorecard,
  type AiQualityThreshold,
} from './ai-quality-scorecard';

// The hospital's own drift rule: the card applies it and says what it is.
const RULE: AiQualityThreshold[] = [
  { metric: 'approvedAsIs', watch: 75, drift: 60 },
  { metric: 'avgEdits', watch: 2, drift: 3 },
];

const trend = (values: number[]) =>
  values.map((approvedAsIs, index) => ({
    label: `${index * 2 + 1} Jul`,
    approvedAsIs,
  }));

const meta = {
  title: 'AI/AiQualityScorecard',
  component: AiQualityScorecard,
  args: {
    name: 'AI Scribe',
    description:
      'Consultation notes · measured against the doctor’s final approved version',
    metrics: { drafts: 1842, approvedAsIs: 84.1, avgEdits: 0.9, rejected: 1.8 },
    thresholds: RULE,
    trend: trend([80.2, 81.0, 82.4, 83.1, 83.9, 84.1]),
    fleet: { approvedAsIs: 79.4 },
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AiQualityScorecard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Healthy: Story = {};

export const Watch: Story = {
  args: {
    name: 'Lab Summarizer',
    description: 'Plain-language result summaries',
    metrics: { drafts: 612, approvedAsIs: 71.9, avgEdits: 1.7, rejected: 5.6 },
    trend: trend([74.0, 73.2, 72.8, 72.1, 71.9, 71.9]),
    fleet: { approvedAsIs: 74.5 },
  },
};

export const Drift: Story = {
  args: {
    name: 'Discharge Drafter',
    description: 'Discharge summaries',
    metrics: { drafts: 178, approvedAsIs: 58.4, avgEdits: 3.6, rejected: 9 },
    trend: trend([72.0, 70.5, 66.1, 63.0, 60.2, 58.4]),
    fleet: { approvedAsIs: 71.2 },
    driftMessage:
      'Concentrated in Orthopedics since the TKR package pathway was added on 09 Jul. Recommended: re-ground on the 12 post-09-Jul orthopedic discharges (about 4 min, no downtime).',
    driftAction: <AiButton size="sm">Approve re-grounding</AiButton>,
    corrections: [
      {
        id: 'c1',
        label: 'Discharge summary uses the old TKR physio schedule',
        who: 'Dr. P. Anil Kumar',
        count: 12,
        timeLost: '38 min',
      },
      {
        id: 'c2',
        label: 'Follow-up date written as a weekday, not a date',
        who: 'Sister Vasavi',
        count: 5,
        timeLost: '9 min',
        resolved: 'Fixed 12 Jul',
      },
    ],
    onOpenCorrection: () => undefined,
    rejections: [
      {
        id: 'r1',
        reason: 'Carried the old TKR physio schedule',
        count: 11,
        worker: 'Discharge Drafter',
        outcome: 'Bundled into the open drift alert — awaiting your approval',
      },
      {
        id: 'r2',
        reason: 'One-off, no repeated pattern',
        count: 4,
        worker: 'Discharge Drafter',
        outcome: 'Logged; nothing to fix',
      },
    ],
  },
};
