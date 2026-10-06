import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiSourceLine } from '../ai-source-line/ai-source-line';
import { VoiceEntryCapture, type VoiceParsed } from './voice-entry-capture';

// Fictional patients and staff throughout, in the prototype's words (14-nursing.html).
const SAID =
  '“GM-03 Irfan, temperature nooru point four, pulse ninety-six, BP one twenty-two by seventy-eight, respiratory rate nineteen, SpO₂ ninety-eight room air, pain two by ten, sugar nooru four.”';

const PARSED: VoiceParsed = {
  temp: { value: '100.4', confidence: 'low', heard: 'nooru point four' },
  pulse: { value: '96' },
  sys: { value: '122' },
  dia: { value: '78' },
  rr: { value: '19' },
  spo2: { value: '98' },
  pain: { value: '2' },
  grbs: { value: '104', confidence: 'medium', heard: 'nooru four' },
};

const meta = {
  title: 'AI/VoiceEntryCapture',
  component: VoiceEntryCapture,
  args: {
    title: 'Voice entry — GM-03',
    approverName: 'Mary Grace',
    transcript: SAID,
    parsed: PARSED,
    lastValues: {
      temp: '100.6',
      pulse: '98',
      sys: '120',
      dia: '76',
      rr: '20',
      spo2: '97',
      pain: '2',
      grbs: '112',
    },
    source: (
      <AiSourceLine label="Transcribed">
        on the tablet, 11 seconds of speech, Telugu-English code-switched.
        Numbers are only taken from the words you said; a field you did not
        speak stays empty.
      </AiSourceLine>
    ),
  },
} satisfies Meta<typeof VoiceEntryCapture>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Listening: Story = {
  args: {
    status: 'listening',
    transcript: '“GM-03 Irfan, temperature nooru point four, pulse',
    source: undefined,
  },
};

// One low-confidence value, one out of range, one not spoken (pain is left out here).
export const Parsed: Story = {
  args: {
    defaultStatus: 'parsed',
    parsed: Object.fromEntries(
      Object.entries(PARSED).filter(([key]) => key !== 'pain'),
    ),
  },
};

export const Approved: Story = {
  args: {
    status: 'approved',
    approvedBy: 'Mary Grace',
    approvedAt: '10:47 AM',
  },
};
