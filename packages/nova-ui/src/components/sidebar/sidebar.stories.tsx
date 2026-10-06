import type { ReactNode } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { NavItem } from './nav-item';
import { Sidebar } from './sidebar';

const fixedWidth: Decorator = (Story) => (
  <div className="w-62">
    <Story />
  </div>
);

const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
  // The sidebar is as tall as the viewport from md up, so give it the whole canvas.
  parameters: { layout: 'fullscreen' },
  decorators: [fixedWidth],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      {children}
    </svg>
  );
}

const items = (
  <>
    <NavItem
      href="#dashboard"
      active
      icon={
        <Icon>
          <rect x="3" y="3" width="5.5" height="5.5" rx="1.2" />
          <rect x="11.5" y="3" width="5.5" height="5.5" rx="1.2" />
          <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.2" />
          <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.2" />
        </Icon>
      }
    >
      Dashboard
    </NavItem>
    <NavItem
      href="#patients"
      icon={
        <Icon>
          <circle cx="10" cy="6.5" r="3" />
          <path d="M3.5 17c.6-3.2 3.2-5 6.5-5s5.9 1.8 6.5 5" />
        </Icon>
      }
    >
      Patients
    </NavItem>
    <NavItem
      href="#claims"
      icon={
        <Icon>
          <path d="M5.5 3h6L15 6.5V16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 .5-1z" />
          <path d="M7.5 11h5M7.5 14h3.5" />
        </Icon>
      }
    >
      Claims
    </NavItem>
    <NavItem
      href="#settings"
      icon={
        <Icon>
          <path d="M4 6h8M15 6h1M4 14h1M8 14h8" />
          <circle cx="13.5" cy="6" r="1.6" />
          <circle cx="6.5" cy="14" r="1.6" />
        </Icon>
      }
    >
      Settings
    </NavItem>
  </>
);

export const Default: Story = {
  args: {
    brand: <span className="text-body font-semibold">Acme Hospital</span>,
    footer: (
      <div className="text-callout">
        <p className="font-semibold">Dr. Anita Rao</p>
        <p className="text-[color:var(--nova-chrome-ink-2)]">Cardiology</p>
      </div>
    ),
    children: items,
  },
};

export const NavOnly: Story = {
  args: { children: items },
};
