import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiPanel } from '../ai-panel/ai-panel';
import { Button } from '../button/button';
import { AiProgressSteps } from './ai-progress-steps';

// The prototype's discharge-summary moment (hos-sim.js aiProgress).
const STEPS = [
  'Reading 12 nursing notes',
  'Reading 8 vitals',
  'Reading the lab report',
  'Drafting the course in hospital',
];

const meta = {
  title: 'AI/AiProgressSteps',
  component: AiProgressSteps,
  args: { steps: STEPS },
  decorators: [
    (Story) => (
      <div className="max-w-[420px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AiProgressSteps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Starting: Story = { args: { currentIndex: 0 } };

export const Midway: Story = { args: { currentIndex: 2 } };

export const Done: Story = {
  args: { currentIndex: STEPS.length, summary: 'Done in 1.8 s' },
};

export const Comfortable: Story = {
  args: { currentIndex: 1, density: 'comfortable' },
};

// Inside an AI block, which already says it is AI: the caption is hidden, the name kept.
export const InsideAnAiPanel: Story = {
  render: (args) => (
    <AiPanel title="Discharge summary">
      <AiProgressSteps {...args} currentIndex={1} showLabel={false} />
    </AiPanel>
  ),
};

// Advancing on its own, as the prototype's staged lines do (about 0.75 s a step).
export const Live: Story = {
  render: function Render(args) {
    const [index, setIndex] = useState(0);
    useEffect(() => {
      if (index > STEPS.length - 1) return;
      const timer = window.setTimeout(() => setIndex(index + 1), 750);
      return () => window.clearTimeout(timer);
    }, [index]);
    return (
      <div className="flex flex-col items-start gap-3">
        <AiProgressSteps
          {...args}
          currentIndex={index}
          summary={`Done in ${(STEPS.length * 0.75).toFixed(1)} s`}
        />
        <Button size="sm" variant="ghost" onClick={() => setIndex(0)}>
          Run again
        </Button>
      </div>
    );
  },
};
