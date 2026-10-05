import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import {
  WorkspaceSwitcher,
  type WorkspaceGroup,
  type WorkspaceOption,
} from './workspace-switcher';

const groups: WorkspaceGroup[] = [
  {
    label: 'Hospitals',
    items: [
      { id: 'sv', name: 'Sri Venkateshwara Hospital', label: 'Kukatpally' },
      { id: 'kr', name: 'Krishna Hospital', label: 'Vijayawada' },
      { id: 'vs', name: 'Vasavi Hospital', label: 'No access', disabled: true },
    ],
  },
  {
    label: 'Units',
    items: [
      { id: 'icu', name: 'ICU' },
      { id: 'ot', name: 'Operation Theatre' },
    ],
  },
];

const decorate: Decorator = (Story) => (
  <div className="nova-chrome h-96 w-64 rounded-lg p-3">
    <Story />
  </div>
);

const meta = {
  title: 'Components/WorkspaceSwitcher',
  component: WorkspaceSwitcher,
  parameters: { layout: 'padded' },
  // The trigger is made for the dark sidebar; the menu is a light overlay.
  decorators: [decorate],
} satisfies Meta<typeof WorkspaceSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled({ startOpen }: { startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [current, setCurrent] = useState<WorkspaceOption>({
    id: 'kr',
    name: 'Krishna Hospital',
    label: 'Vijayawada',
  });
  return (
    <WorkspaceSwitcher
      current={current}
      groups={groups}
      open={open}
      onOpenChange={setOpen}
      onSelect={(id) => {
        const next = groups.flatMap((g) => g.items).find((i) => i.id === id);
        if (next) setCurrent(next);
      }}
      hint="Switch workspace"
    />
  );
}

export const Closed: Story = {
  args: {
    current: { id: 'kr', name: 'Krishna Hospital', label: 'Vijayawada' },
    groups,
    open: false,
    onOpenChange: () => undefined,
    onSelect: () => undefined,
  },
  render: () => <Controlled startOpen={false} />,
};

export const Open: Story = {
  name: 'Open (current is ticked, bold and aria-checked)',
  args: Closed.args,
  render: () => <Controlled startOpen />,
};

export const Uncontrolled: Story = {
  name: 'Uncontrolled (keeps its own open state)',
  args: Closed.args,
  render: () => (
    <WorkspaceSwitcher
      current={{ id: 'kr', name: 'Krishna Hospital', label: 'Vijayawada' }}
      groups={groups}
      onSelect={() => undefined}
    />
  ),
};
