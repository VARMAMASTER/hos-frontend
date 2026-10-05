import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardBody, CardHeader } from '../card/card';
import { ActivityFeed } from './activity-feed';

const decorate: Decorator = (Story) => (
  <Card className="max-w-lg">
    <CardHeader title="Ward activity" description="Newest first" />
    <CardBody className="p-0">
      <Story />
    </CardBody>
  </Card>
);

const meta = {
  title: 'Components/ActivityFeed',
  component: ActivityFeed,
  decorators: [decorate],
} satisfies Meta<typeof ActivityFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTones: Story = {
  args: {
    'aria-label': 'Ward activity',
    items: [
      {
        id: '1',
        time: '09:12 AM',
        title: 'Bed 4 vacated',
        detail: 'Sent for cleaning',
      },
      {
        id: '2',
        time: '08:40 AM',
        title: 'Discharge summary filed',
        tone: 'good',
      },
      {
        id: '3',
        time: '07:48 AM',
        title: 'Ramesh moved to ICU',
        detail: 'Transfer approved by the ward consultant',
        tone: 'warn',
      },
      {
        id: '4',
        time: '07:15 AM',
        title: 'Monitor alarm in bed 9',
        tone: 'crit',
      },
      { id: '5', time: '06:50 AM', title: 'Lab results are in', tone: 'info' },
      {
        id: '6',
        time: '06:30 AM',
        title: 'Handover note drafted',
        detail: 'Awaiting nurse review',
        tone: 'ai',
      },
    ],
  },
};

export const Empty: Story = {
  args: { items: [], emptyMessage: 'Nothing has happened on this ward yet' },
};
