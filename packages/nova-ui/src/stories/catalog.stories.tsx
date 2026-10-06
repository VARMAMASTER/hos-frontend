import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertDialog } from '../components/alert-dialog/alert-dialog';
import { Button } from '../components/button/button';
import { Card } from '../components/card/card';
import { NotificationBell } from '../components/notification-bell/notification-bell';
import { OtpInput } from '../components/otp-input/otp-input';
import { Surface } from '../primitives/surface';
import { StatGauge } from '../components/stat-gauge/stat-gauge';
import { showToast, Toaster } from '../components/toast/toast';

const meta = {
  title: 'Foundations/Catalog',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function SignInCard() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const verify = (done: string) => {
    if (done === '123456') showToast('Signed in', 'success');
    else setError('That code is not right. Try again.');
  };
  return (
    <Card className="flex max-w-sm flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[17px] font-bold text-ink">Sign in</h2>
        <p className="text-[13px] text-ink-2">
          Enter the code we sent to +91 98xxx xx210.
        </p>
      </div>
      <OtpInput
        label="Verification code"
        hint="Try 123456 to succeed."
        value={code}
        error={error}
        onChange={(next) => {
          setCode(next);
          setError(undefined);
        }}
        onComplete={verify}
      />
      <Button className="w-full" disabled={code.length < 6}>
        Verify
      </Button>
    </Card>
  );
}

export const SignInWithOtp: Story = {
  render: () => (
    <>
      <Toaster />
      <SignInCard />
    </>
  ),
};

export const DashboardGauges: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatGauge label="Bed occupancy" value={72} />
      <StatGauge
        label="ICU beds in use"
        value={9}
        max={12}
        valueText="9 of 12"
      />
      <StatGauge label="Discharges done today" value={18} max={24} />
    </div>
  ),
};

function Bell() {
  const [count, setCount] = useState(120);
  return (
    // The bell is a .tb-ico top-bar control, so it is shown on the chrome it belongs to.
    <Surface
      material="chrome"
      radius="md"
      className="flex items-center gap-3 px-6 py-3"
    >
      <NotificationBell count={count} onClick={() => setCount(0)} />
      <span className="text-[13px] text-(color:--nova-chrome-ink-2)">
        Press the bell to mark them read.
      </span>
    </Surface>
  );
}

export const Notifications: Story = { render: () => <Bell /> };

export const ToastTrigger: Story = {
  render: () => (
    <>
      <Toaster />
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => showToast('Vitals saved to the chart')}>
          Save vitals
        </Button>
        <Button
          onClick={() => showToast('Could not reach the lab system.', 'error')}
        >
          Simulate an error
        </Button>
      </div>
    </>
  ),
};

function DischargeConfirm() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Toaster />
      <Button onClick={() => setOpen(true)}>Discharge patient…</Button>
      <AlertDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Discharge patient?"
        message="Ramesh will be discharged and the bed released. This cannot be undone."
        actions={[
          { label: 'Cancel', role: 'cancel' },
          {
            label: 'Discharge',
            role: 'destructive',
            onSelect: () => showToast('Patient discharged', 'success'),
          },
        ]}
      />
    </>
  );
}

export const AlertConfirm: Story = { render: () => <DischargeConfirm /> };
