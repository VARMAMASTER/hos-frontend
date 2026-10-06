import type { Meta, StoryObj } from '@storybook/react-vite';
import { LearnedPreferenceRow } from './learned-preference-row';

const meta = {
  title: 'AI/LearnedPreferenceRow',
  component: LearnedPreferenceRow,
  args: {
    learned:
      'You always add a renal-function note for older patients on Metformin',
    why: 'Learned from 6 corrections you made in 30 days.',
    does: 'every draft for a patient over 55 on Metformin carries your renal line and cites the eGFR it read. It still does not pick a dose.',
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LearnedPreferenceRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = { args: { onCorrect: () => undefined } };

// Off, the row dims to the quiet inks and says it is doing nothing.
export const Off: Story = {
  args: {
    learned: 'Shortening your Subjective section to two lines',
    defaultEnabled: false,
    whenOff:
      "You switched this off on 04 Jul, after a shortened S dropped a patient's mention of night sweats.",
    does: 'compress S to the two most clinically loaded sentences.',
    onCorrect: () => undefined,
  },
};

// Correct this opens an inline editor; the correction is sent and forgotten.
export const InlineCorrection: Story = {
  args: { onSubmitCorrection: () => undefined },
};

export const Telugu: Story = {
  args: {
    learned: 'Your Telugu counselling register is spoken, not formal',
    why: 'Learned from 14 of your own Telugu lines rewritten. You say షుగర్, never మధుమేహం.',
    does: 'drafts every patient-facing Telugu line in your spoken register.',
    onCorrect: () => undefined,
  },
};
