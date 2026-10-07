import type { Meta, StoryObj } from '@storybook/react-vite';
import { AmbientScribeRecorder } from './ambient-scribe-recorder';

// Fictional patients and staff throughout. The recorder never touches a microphone: each story
// holds a status and fixed levels. AI/Voice has the simulated, moving waveform.
const meta = {
  title: 'AI/AmbientScribeRecorder',
  component: AmbientScribeRecorder,
  args: {
    language: 'Telugu + English',
    elapsedSeconds: 161,
    levels: [0.3, 0.8, 0.55, 0.95, 0.4],
    consent: (
      <p>
        Lakshmi Devi agreed to this consultation being recorded for her note.
      </p>
    ),
  },
} satisfies Meta<typeof AmbientScribeRecorder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const Requesting: Story = { args: { status: 'requesting' } };

export const Denied: Story = {
  args: {
    status: 'denied',
    deniedHelp: (
      <a className="font-semibold text-primary-strong underline" href="#mic">
        How to enable the microphone
      </a>
    ),
  },
};

export const Recording: Story = {
  args: {
    status: 'recording',
    interim: '“కాళ్ళలో తిమ్మిరి…” — tingling in both feet… two weeks…',
    interimLang: 'te',
  },
};

export const Paused: Story = {
  args: {
    status: 'paused',
    interim: 'worse at night… disturbs her sleep…',
  },
};

export const Stopped: Story = { args: { status: 'stopped' } };

export const Processing: Story = {
  args: {
    status: 'processing',
    steps: [
      { label: 'Transcribing 02:41 of Telugu + English…', state: 'done' },
      { label: 'Extracting symptoms & vitals…', state: 'done' },
      { label: 'Checking drug interactions & allergies…', state: 'active' },
      { label: 'Drafting SOAP note…', state: 'pending' },
    ],
  },
};

export const Done: Story = {
  args: {
    status: 'done',
    draft: (
      <p className="text-control text-ink-2">
        The SOAP draft is ready below for your review.
      </p>
    ),
  },
};

export const LanguageMenu: Story = {
  args: {
    status: 'recording',
    language: 'te-en',
    languageOptions: [
      { value: 'te-en', label: 'Telugu + English' },
      { value: 'hi-en', label: 'Hindi + English' },
      { value: 'en', label: 'English' },
    ],
    onLanguageChange: () => undefined,
  },
};
