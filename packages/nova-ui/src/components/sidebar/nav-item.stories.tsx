import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { NavItem } from './nav-item';

const onChrome: Decorator = (Story) => (
  <div className="nova-chrome flex w-64 flex-col gap-1 rounded-lg p-4">
    <Story />
  </div>
);

const meta = {
  title: 'Components/NavItem',
  // NavItem lives on the dark chrome, so every story sits on it.
  decorators: [onChrome],
} satisfies Meta;

export default meta;
type Story = StoryObj;

function GridIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      className="size-5"
    >
      <rect x="3" y="3" width="5.5" height="5.5" rx="1.2" />
      <rect x="11.5" y="3" width="5.5" height="5.5" rx="1.2" />
      <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.2" />
    </svg>
  );
}

export const Resting: Story = {
  render: () => <NavItem href="#patients">Patients</NavItem>,
};

export const Active: Story = {
  render: () => (
    <NavItem href="#dashboard" active>
      Dashboard
    </NavItem>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <>
      <NavItem href="#dashboard" icon={<GridIcon />} active>
        Dashboard
      </NavItem>
      <NavItem href="#patients" icon={<GridIcon />}>
        Patients
      </NavItem>
    </>
  ),
};

export const AsButton: Story = {
  render: () => (
    <>
      <NavItem as="button" icon={<GridIcon />}>
        Open ward switcher
      </NavItem>
      <NavItem as="button" icon={<GridIcon />} active>
        Current ward
      </NavItem>
    </>
  ),
};
