import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { AlertDialog, type AlertAction } from './alert-dialog';

const meta = {
  title: 'Components/AlertDialog',
  component: AlertDialog,
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({
  title,
  message,
  actions,
}: {
  title: string;
  message?: string;
  actions: AlertAction[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open alert</Button>
      <AlertDialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        message={message}
        actions={actions}
      />
    </>
  );
}

const noArgs = {
  open: false,
  onClose: () => undefined,
  title: '',
  actions: [],
};

export const TwoActions: Story = {
  args: noArgs,
  render: () => (
    <Demo
      title="Discharge patient?"
      message="The bed will be released. This cannot be undone."
      actions={[
        { label: 'Cancel', role: 'cancel' },
        { label: 'Discharge', role: 'destructive' },
      ]}
    />
  ),
};

export const OneAction: Story = {
  args: noArgs,
  render: () => (
    <Demo
      title="Session expired"
      message="Sign in again to continue."
      actions={[{ label: 'Sign in' }]}
    />
  ),
};

export const ThreeActions: Story = {
  args: noArgs,
  render: () => (
    <Demo
      title="Unsaved changes"
      message="You have not saved this admission form."
      actions={[
        { label: 'Save draft' },
        { label: 'Discard changes', role: 'destructive' },
        { label: 'Keep editing', role: 'cancel' },
      ]}
    />
  ),
};
