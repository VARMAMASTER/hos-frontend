import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { Textarea } from '../textarea/textarea';
import { Dialog } from './dialog';

const meta = { title: 'Components/Dialog' } satisfies Meta;

export default meta;

function ConfirmDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Discharge patient</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Discharge patient?"
        description="This closes the current episode and notifies the family."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Discharge</Button>
          </>
        }
      />
    </>
  );
}

function FormDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Add a progress note</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Progress note"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save note</Button>
          </>
        }
      >
        <Textarea label="Note" rows={5} hint="Visible to the whole care team" />
      </Dialog>
    </>
  );
}

// Focus lands on the first button of a confirmation and on the first field of a form; Tab cycles
// inside; Escape or the close button closes; focus goes back to the button that opened it. Clicking
// the dimmed area does nothing, so a stray click cannot discard a note.
export const Confirmation: StoryObj = { render: () => <ConfirmDemo /> };
export const WithForm: StoryObj = { render: () => <FormDemo /> };
