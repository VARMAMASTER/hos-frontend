import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { Menu, MenuItem } from './menu';

const meta = { title: 'Components/Menu' } satisfies Meta;

export default meta;

function MenuDemo() {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState('Nothing chosen yet');
  return (
    <div className="flex min-h-menu-room items-start gap-s6">
      <Menu
        trigger={<Button variant="outline">Actions</Button>}
        open={open}
        onOpenChange={setOpen}
      >
        <MenuItem onClick={() => setChosen('Edit details')}>
          Edit details
        </MenuItem>
        <MenuItem onClick={() => setChosen('Print wristband')}>
          Print wristband
        </MenuItem>
        <MenuItem disabled>Transfer (needs sign-off)</MenuItem>
        <MenuItem
          className="text-crit-deep"
          onClick={() => setChosen('Discharge')}
        >
          Discharge…
        </MenuItem>
      </Menu>
      <p className="py-s3 text-control text-ink-2" aria-live="polite">
        {chosen}
      </p>
    </div>
  );
}

// Click the button, or focus it and press the Down or Up arrow. Arrows, Home and End move; Escape
// closes and returns to the button; Tab closes.
export const Default: StoryObj = { render: () => <MenuDemo /> };
