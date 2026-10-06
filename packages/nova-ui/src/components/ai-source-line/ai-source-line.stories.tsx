import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiSourceLine } from './ai-source-line';

const meta = {
  title: 'AI/AiSourceLine',
  component: AiSourceLine,
  args: { children: '214 discharge summaries sampled' },
} satisfies Meta<typeof AiSourceLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const HighConfidence: Story = { args: { confidence: 'high' } };

export const MediumConfidence: Story = { args: { confidence: 'medium' } };

// The explicit warning: the value was read from a blurred line, so a person reads it themselves.
export const LowConfidence: Story = {
  args: {
    confidence: 'low',
    children: 'Lab report, page 1 · line 6 · blurred',
  },
};

export const FromEvent: Story = {
  args: {
    children: 'Nursing note 16 Jul, 21:40',
    eventHref: '#event-2291',
    eventLabel: 'from event',
  },
};

export const Telugu: Story = {
  args: {
    label: 'మూలం',
    contentLang: 'te',
    children: 'కన్సల్ట్ ఆడియో 10:41–10:44',
    confidence: 'high',
    confidenceLabels: { high: 'నమ్మకం ఎక్కువ' },
  },
};
