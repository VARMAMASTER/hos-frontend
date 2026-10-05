import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline } from './timeline';

const meta = {
  title: 'Components/Timeline',
  component: Timeline,
  args: {
    'aria-label': 'Event history',
    items: [
      {
        id: 'draft',
        time: '14 Oct, 11:20',
        title: 'Discharge summary drafted',
        description: 'Awaiting clinician review',
        tone: 'ai',
      },
      {
        id: 'potassium',
        time: '14 Oct, 09:40',
        title: 'Potassium flagged critical',
        description: '6.1 mmol/L, recheck ordered',
        tone: 'crit',
      },
      {
        id: 'antibiotics',
        time: '13 Oct, 18:05',
        title: 'Switched to oral antibiotics',
        tone: 'good',
      },
      {
        id: 'review',
        time: '11 Oct, 16:10',
        title: 'Consultant review',
        description: 'Plan agreed with the family',
        tone: 'info',
      },
      {
        id: 'admitted',
        time: '11 Oct, 09:02',
        title: 'Admitted via emergency',
        description: 'Ward 4B, bed 12',
      },
    ],
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

// An ordered list in the order given. The AI event is marked by its spark and a text label for
// assistive technology, not by its colour alone.
export const PatientHistory: Story = {};

export const AllTones: Story = {
  args: {
    items: [
      { id: 'neutral', time: '09:00', title: 'Neutral event' },
      { id: 'good', time: '09:10', title: 'Good event', tone: 'good' },
      { id: 'warn', time: '09:20', title: 'Warning event', tone: 'warn' },
      { id: 'crit', time: '09:30', title: 'Critical event', tone: 'crit' },
      { id: 'info', time: '09:40', title: 'Information event', tone: 'info' },
      { id: 'ai', time: '09:50', title: 'AI event', tone: 'ai' },
    ],
  },
};
