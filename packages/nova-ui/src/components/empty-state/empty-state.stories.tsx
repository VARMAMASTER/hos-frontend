import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { EmptyState } from './empty-state';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  args: {
    title: 'No lab results yet',
    description: 'Results appear here as soon as the lab files them.',
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: { action: <Button variant="secondary">Order a test</Button> },
};

export const WithIcon: Story = {
  args: {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M9 3h6M10 3v6.5L4.6 18.6A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.7-2.9L14 9.5V3" />
      </svg>
    ),
    action: <Button>Order a test</Button>,
  },
};

export const TitleOnly: Story = {
  args: { title: 'Nothing to review', description: undefined },
};
