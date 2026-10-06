import type { Meta, StoryObj } from '@storybook/react-vite';
import { WhyTrail } from './why-trail';

const meta = {
  title: 'AI/WhyTrail',
  component: WhyTrail,
  args: {
    reasons: [
      <>
        The discharge summary asks for review in OPD on{' '}
        <b className="font-bold">Sunday 26 Jul</b>, for suture removal.
      </>,
      'Orthopaedics has no OPD session on Sundays.',
      'The nearest session is Monday 27 Jul; 10:30 AM is free on the consultant list.',
    ],
    sources:
      'IPD discharge summary (follow-up plan) · Orthopaedics OPD roster · consultant Monday list',
  },
} satisfies Meta<typeof WhyTrail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = { args: { defaultOpen: true } };
