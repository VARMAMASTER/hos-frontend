import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { clearToasts, showToast, Toaster } from './toast';

const meta = {
  title: 'Components/Toast',
  component: Toaster,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

// The Toaster is mounted once; showToast can be called from anywhere.
export const Tones: Story = {
  render: () => (
    <>
      <Toaster />
      <div className="flex flex-wrap gap-s5">
        <Button onClick={() => showToast('Vitals saved to the chart')}>
          Info
        </Button>
        <Button onClick={() => showToast('Patient discharged', 'good')}>
          Success
        </Button>
        <Button
          onClick={() =>
            showToast('Could not reach the lab system. Try again.', 'crit')
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
          showToast('Oxygen saturation below 90% in bed 12', 'crit', {
            duration: 0,
          })
        }
      >
        Raise a sticky error
      </Button>
    </>
  ),
};

// All three tones at once, kept up, for looking at the stack the way the prototype stacks them.
function Stack() {
  useEffect(() => {
    clearToasts();
    showToast('Vitals saved to the chart', 'info', { duration: 0 });
    showToast('Patient discharged', 'good', { duration: 0 });
    showToast('Could not reach the lab system. Try again.', 'crit', {
      duration: 0,
    });
    return clearToasts;
  }, []);
  return <Toaster />;
}

export const Stacked: Story = { render: () => <Stack /> };
