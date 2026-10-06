import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../avatar/avatar';
import { Button } from '../button/button';
import { Chip } from '../chip/chip';
import { SearchField } from '../search-field/search-field';
import { NavItem } from '../sidebar/nav-item';
import { NavSection } from '../sidebar/nav-section';
import { Sidebar } from '../sidebar/sidebar';
import { TopBar } from '../top-bar/top-bar';
import { AppShell } from './app-shell';

const meta = {
  title: 'Components/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppShell>;

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

const sidebar = (
  <Sidebar
    brand={
      <span className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-md bg-primary font-display text-[14px] font-bold text-on-primary">
          AH
        </span>
        <span className="font-display text-[16px] font-bold text-on-primary">
          Acme Hospital
        </span>
      </span>
    }
    collapsedBrand={
      <span
        role="img"
        aria-label="Acme Hospital"
        className="grid size-9 place-items-center rounded-md bg-primary font-display text-[14px] font-bold text-on-primary"
      >
        AH
      </span>
    }
    footer={
      <div className="flex items-center gap-2.5 text-[13px]">
        <Avatar name="Anita Rao" tone="chrome" />
        <div className="min-w-0">
          <p className="font-semibold text-on-primary">Dr. Anita Rao</p>
          <p className="text-[color:var(--nova-chrome-ink-2)]">Cardiology</p>
        </div>
      </div>
    }
    collapsedFooter={<Avatar name="Anita Rao" tone="chrome" />}
  >
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
  </Sidebar>
);

const content = (
  <>
    <TopBar
      search={
        <SearchField
          label="Search patients, claims and orders"
          placeholder="Search patients, claims and orders"
          shortcutHint="Ctrl K"
        />
      }
      actions={
        <>
          <Chip tone="ai">3 AI drafts</Chip>
          <Button variant="outline" size="sm">
            New admission
          </Button>
        </>
      }
    />
    <div className="p-6">
      <h1 className="text-[17px] font-semibold text-ink">Dashboard</h1>
      <p className="mt-2 text-ink-2">
        The content column sits on the brand canvas and reflows with the
        sidebar. Ctrl/Cmd+B collapses it to the icon rail; below 768px it is a
        drawer behind the menu button. See the full page under Pages / App
        shell.
      </p>
    </div>
  </>
);

// Expanded, the prototype's layout. The toggle in the sidebar header collapses it.
export const Default: Story = { args: { sidebar, children: content } };

// The icon rail: the content column grows into the space.
export const CollapsedRail: Story = {
  args: { sidebar, children: content, defaultCollapsed: true },
};

// The shell remembers the choice under its persistKey, in localStorage.
export const Persisted: Story = {
  args: { sidebar, children: content, persistKey: 'nova-story-sidebar' },
};

function ControlledRailDemo() {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <AppShell
      sidebar={sidebar}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
    >
      {content}
    </AppShell>
  );
}

// Controlled: the caller owns the rail state.
export const ControlledRail: Story = {
  args: { sidebar, children: content },
  render: () => <ControlledRailDemo />,
};

// Below 768px the sidebar is a drawer: the menu button in the top bar opens it over the content with
// a scrim; Escape, the scrim and the close button put it away, and focus returns to the menu button.
export const MobileDrawer: Story = {
  args: { sidebar, children: content },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

export const MobileDrawerOpen: Story = {
  args: { sidebar, children: content, defaultDrawerOpen: true },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};
