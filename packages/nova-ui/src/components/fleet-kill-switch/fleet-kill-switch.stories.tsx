import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { FleetKillSwitch } from './fleet-kill-switch';
import { ReasonDialog } from './reason-dialog';

const IMPACT = [
  "Stops 14 hospitals' discharge drafts within seconds",
  'Staff see the feature absent, not broken; approved work is untouched',
  'Every affected hospital owner sees this entry in their own audit log',
];

const meta = {
  title: 'AI/FleetKillSwitch',
  component: FleetKillSwitch,
  args: {
    worker: 'Discharge Drafter',
    description: 'Discharge summaries · v2.4 on 14 tenants',
    scope: 'fleet',
    impact: IMPACT,
    rollbackImpact: [
      'Drafting resumes for every entitled tenant at their next request',
    ],
    tier: 'green',
    tierDetail: 'productivity',
    actor: 'Dr. G. Prakash',
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FleetKillSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

// Switch it off: the dialog states the impact and waits for a reason. Cancel has the focus.
export const Enabled: Story = {};

export const Disabled: Story = {
  args: {
    defaultState: 'disabled',
    defaultRecord: {
      action: 'disabled',
      by: 'Dr. G. Prakash',
      at: '18 Jul, 04:20 PM',
      reason:
        'Edit distance tripled at 2 tenants and the cause is unknown — off until root-caused.',
    },
  },
};

// Roll back: the re-enable takes a reason too, and the row shows rolling back until it lands.
export const RollingBack: Story = {
  args: {
    defaultState: 'disabled',
    onRollback: () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, 2000);
      }),
  },
};

export const TenantScope: Story = {
  args: {
    scope: 'tenant',
    scopeName: 'Sri Venkateshwara',
    impact: [
      'Only this hospital is affected; the fleet keeps running',
      'Their clinicians go back to typing, so tell them first',
    ],
  },
};

// RED tier: the switch is disabled and Why blocked says which licence it waits on.
export const LockedRedTier: Story = {
  args: {
    worker: 'Sepsis early prediction',
    description: 'Predicts deterioration from charted vitals',
    tier: 'red',
    tierDetail: 'medical device',
    lockedReason:
      'A medical device under the Medical Device Rules 2017. Awaits a CDSCO Class C licence; no HOS role can override this.',
  },
};

export const ReasonDialogAlone: Story = {
  render: () => <ReasonDemo />,
};

function ReasonDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Disable all AI fleet-wide
      </Button>
      <ReasonDialog
        open={open}
        title="Disable ALL AI fleet-wide"
        description="Stops all 8 live AI workers across all 10 tenants."
        impact={[
          'Staff keep working: the hospital falls back to manual entry',
          'Reversible in one action; both changes are permanent log entries',
        ]}
        confirmLabel="Disable all AI"
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}
