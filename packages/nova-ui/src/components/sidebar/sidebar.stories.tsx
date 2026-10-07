import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../avatar/avatar';
import { Button } from '../button/button';
import { NavItem } from './nav-item';
import { NavSection } from './nav-section';
import { Sidebar } from './sidebar';

const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
  // The sidebar is as tall as the viewport from md up, so give it the whole canvas.
  parameters: { layout: 'fullscreen' },
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
      className="size-icon-lg"
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
    <NavSection label="Revenue">
      <NavItem
        href="#claims"
        badge={12}
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
    </NavSection>
  </>
);

// The hospital block and the user footer each have a small form for the rail: the logo mark and the
// avatar.
const brand = (
  <span className="flex items-center gap-s4">
    <span className="grid size-chrome-tile place-items-center rounded-card bg-primary font-display text-body font-bold text-on-primary">
      AH
    </span>
    <span className="font-display text-subtitle font-bold text-on-primary">
      Acme Hospital
    </span>
  </span>
);
const logoMark = (
  <span
    role="img"
    aria-label="Acme Hospital"
    className="grid size-chrome-tile place-items-center rounded-card bg-primary font-display text-body font-bold text-on-primary"
  >
    AH
  </span>
);
const footer = (
  <div className="flex items-center gap-s4 text-control">
    <Avatar name="Anita Rao" tone="chrome" />
    <div className="min-w-0">
      <p className="font-semibold text-on-primary">Dr. Anita Rao</p>
      <p className="text-[color:var(--nova-chrome-ink-2)]">Cardiology</p>
    </div>
  </div>
);
const avatar = <Avatar name="Anita Rao" tone="chrome" />;

const common = {
  brand,
  collapsedBrand: logoMark,
  footer,
  collapsedFooter: avatar,
  children: items,
};

// Expanded is the prototype's sidebar. The toggle in its header, or Ctrl/Cmd+B, collapses it.
export const Expanded: Story = { args: common };

// The icon rail: icons only, each item still named, with its label as a tooltip on hover and focus.
export const Collapsed: Story = { args: { ...common, defaultCollapsed: true } };

export const NavOnly: Story = { args: { children: items } };

function ControlledDemo() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex min-h-screen items-start gap-s8">
      <Sidebar
        {...common}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <div className="flex flex-col gap-s5 p-s8 text-control text-ink">
        <p>
          The sidebar is <strong>{collapsed ? 'collapsed' : 'expanded'}</strong>
          .
        </p>
        <Button size="sm" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? 'Expand from outside' : 'Collapse from outside'}
        </Button>
      </div>
    </div>
  );
}

// Controlled: the caller owns the state, and a button outside the sidebar drives it too.
export const ControlledToggle: Story = {
  args: common,
  render: () => <ControlledDemo />,
};
