import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { showToast, Toaster } from './toast';

const meta = {
  title: 'Components/Toast',
  component: Toaster,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

// The Toaster is mounted once; showToast can be called from anywhere.
export const Variants: Story = {
  render: () => (
    <>
      <Toaster />
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => showToast('Vitals saved to the chart')}>
          Info
        </Button>
        <Button onClick={() => showToast('Patient discharged', 'success')}>
          Success
        </Button>
        <Button
          onClick={() =>
            showToast('Could not reach the lab system. Try again.', 'error')
          }
        >
          Error
        </Button>
      </div>
    </>
  ),
};

export const StaysUntilDismissed: Story = {
  render: () => (
    <>
      <Toaster />
      <Button
        onClick={() =>
          showToast('Oxygen saturation below 90% in bed 12', 'error', {
            duration: 0,
          })
        }
      >
        Raise a sticky error
      </Button>
    </>
  ),
};
