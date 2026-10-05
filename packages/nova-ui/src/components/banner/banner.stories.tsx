import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { Banner } from './banner';

const narrow: Decorator = (Story) => (
  <div className="max-w-2xl">
    <Story />
  </div>
);

const meta = {
  title: 'Components/Banner',
  component: Banner,
  args: { tone: 'info', title: 'Ward round at 4 pm' },
  decorators: [narrow],
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: { children: 'Bring the updated drug charts for beds 10 to 14.' },
};
export const Good: Story = {
  args: {
    tone: 'good',
    title: 'Discharge summary filed',
    children: 'It is on the patient record and has gone to the family.',
  },
};
export const Warn: Story = {
  args: {
    tone: 'warn',
    title: 'Penicillin allergy on file',
    children: 'Documented at the last visit. Check before prescribing.',
  },
};
export const Crit: Story = {
  args: {
    tone: 'crit',
    title: 'Claim denied',
    children: 'The scheme rejected it for a missing pre-authorisation.',
  },
};
export const WithAction: Story = {
  args: {
    tone: 'warn',
    title: 'Pre-authorisation expires tomorrow',
    action: <Button size="sm">Renew</Button>,
  },
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Banner tone="info" title="Ward round at 4 pm" />
      <Banner tone="good" title="Discharge summary filed" />
      <Banner tone="warn" title="Penicillin allergy on file" />
      <Banner tone="crit" title="Claim denied" />
    </div>
  ),
};

function DismissibleBanner() {
  const [shown, setShown] = useState(true);
  return shown ? (
    <Banner
      tone="info"
      title="Visiting hours have changed"
      onDismiss={() => setShown(false)}
      dismissLabel="Dismiss visiting hours notice"
    >
      From Monday, visiting is 5 pm to 7 pm.
    </Banner>
  ) : (
    <Button variant="secondary" onClick={() => setShown(true)}>
      Show the notice again
    </Button>
  );
}

export const Dismissible: Story = { render: () => <DismissibleBanner /> };
