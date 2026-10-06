import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { OtpInput } from './otp-input';

const meta = {
  title: 'Components/OtpInput',
  component: OtpInput,
  args: { label: 'Verification code' },
} satisfies Meta<typeof OtpInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const WithHint: Story = {
  args: { hint: 'We sent a 6-digit code to +91 98xxx xx210.' },
};
export const Filled: Story = { args: { defaultValue: '482913' } };
export const WrongCode: Story = {
  args: {
    defaultValue: '482913',
    error: 'That code is not right. Check the SMS and try again.',
  },
};
export const Disabled: Story = { args: { disabled: true } };

function Verifying() {
  const [error, setError] = useState<string | undefined>();
  const [code, setCode] = useState('');
  return (
    <OtpInput
      label="Verification code"
      hint="Try 123456 to succeed; anything else fails."
      value={code}
      error={error}
      onChange={(next) => {
        setCode(next);
        setError(undefined);
      }}
      onComplete={(done) => {
        if (done !== '123456') setError('That code is not right. Try again.');
      }}
    />
  );
}

export const Interactive: Story = { render: () => <Verifying /> };
