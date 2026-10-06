import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { Tooltip } from './tooltip';

const roomAround: Decorator = (Story) => (
  <div className="flex justify-center py-16">
    <Story />
  </div>
);

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  args: {
    content: 'Needs a second clinician to sign off',
    children: <Button variant="outline">Discharge</Button>,
  },
  // Room for the tooltip on either side of the trigger.
  decorators: [roomAround],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// Hover the button, or Tab to it. Escape dismisses without moving focus.
export const Top: Story = {};
export const Bottom: Story = { args: { placement: 'bottom' } };
