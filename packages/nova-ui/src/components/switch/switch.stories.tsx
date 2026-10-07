import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './switch';

const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: { label: 'Send SMS reminders' },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledOn: Story = {
  args: { disabled: true, defaultChecked: true },
};

function ControlledSwitch() {
  const [on, setOn] = useState(false);
  return (
    <div className="flex flex-col gap-s3">
      <Switch
        label="Isolation precautions"
        checked={on}
        onCheckedChange={setOn}
      />
      <p className="text-control text-ink-2" aria-live="polite">
        {on ? 'Staff will be told to gown up.' : 'Standard precautions.'}
      </p>
    </div>
  );
}

export const Controlled: Story = { render: () => <ControlledSwitch /> };
