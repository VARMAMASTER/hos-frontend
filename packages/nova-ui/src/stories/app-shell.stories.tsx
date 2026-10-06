import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../components/app-shell/app-shell';
import { Button } from '../components/button/button';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { Chip } from '../components/chip/chip';
import { HeroBand } from '../components/hero-band/hero-band';
import { KpiTile } from '../components/kpi-tile/kpi-tile';
import { SearchField } from '../components/search-field/search-field';
import { NavItem } from '../components/sidebar/nav-item';
import { Sidebar } from '../components/sidebar/sidebar';
import { Tab, TabList, TabPanel, Tabs } from '../components/tabs/tabs';
import { TopBar } from '../components/top-bar/top-bar';

// The screen to flip between Glass and Solid, and between hospital themes, in the toolbar.
const meta = {
  title: 'Pages/App shell',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

function Icon({
  children,
  size = 'size-5',
}: {
  children: ReactNode;
  size?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={size}
    >
      {children}
    </svg>
  );
}

const icons = {
  dashboard: (
    <Icon>
      <rect x="3" y="3" width="5.5" height="5.5" rx="1.2" />
      <rect x="11.5" y="3" width="5.5" height="5.5" rx="1.2" />
      <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.2" />
    </Icon>
  ),
  patients: (
    <Icon>
      <circle cx="10" cy="6.5" r="3" />
      <path d="M3.5 17c.6-3.2 3.2-5 6.5-5s5.9 1.8 6.5 5" />
    </Icon>
  ),
  appointments: (
    <Icon>
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
      <path d="M3 8.5h14M7 3v3M13 3v3" />
    </Icon>
  ),
  claims: (
    <Icon>
      <path d="M5.5 3h6L15 6.5V16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 .5-1z" />
      <path d="M7.5 11h5M7.5 14h3.5" />
    </Icon>
  ),
  laboratory: (
    <Icon>
      <path d="M8 3h4M8.8 3v5L4.5 15.2A1.2 1.2 0 0 0 5.5 17h9a1.2 1.2 0 0 0 1-1.8L11.2 8V3" />
    </Icon>
  ),
  settings: (
    <Icon>
      <path d="M4 6h8M15 6h1M4 14h1M8 14h8" />
      <circle cx="13.5" cy="6" r="1.6" />
      <circle cx="6.5" cy="14" r="1.6" />
    </Icon>
  ),
  search: (
    <Icon size="size-4">
      <circle cx="9" cy="9" r="5" />
      <path d="m13 13 3.5 3.5" />
    </Icon>
  ),
};

function Brand() {
  return (
    <span className="flex items-center gap-2 text-base font-semibold">
      <span className="grid size-8 place-items-center rounded-md bg-primary text-sm text-on-primary">
        H
      </span>
      Acme Hospital
    </span>
  );
}

function Overview() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Bed occupancy"
          value="82%"
          delta="3 points on last week"
          trend="up"
        />
        <KpiTile
          label="Claims in flight"
          value="128"
          delta="9 awaiting a reply"
          trend="flat"
          tone="warn"
        />
        <KpiTile
          label="Average stay"
          value="3.4 days"
          delta="0.2 days shorter"
          trend="down"
          tone="good"
        />
        <KpiTile
          label="Denial rate"
          value="3.1%"
          delta="Within target"
          trend="flat"
          tone="good"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="data">
          <CardHeader
            title="Claims in flight"
            description="Every scheme's own clock, in one place"
            actions={<Button size="sm">File claim</Button>}
          />
          <CardBody className="flex flex-wrap gap-2">
            <Chip tone="warn">2 queries</Chip>
            <Chip tone="good">5 filed</Chip>
            <Chip tone="info">3 pre-auth</Chip>
            <Chip tone="crit">1 denied</Chip>
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Today's admissions"
            description="Waiting for review"
            actions={<Chip tone="ai">AI summary ready</Chip>}
          />
          <CardBody className="text-sm text-ink-2">
            14 admissions across 6 wards. Ward 4B has the longest queue.
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function ShellPage() {
  const [tab, setTab] = useState('overview');
  return (
    <AppShell
      sidebar={
        <Sidebar
          brand={<Brand />}
          footer={
            <div className="text-sm">
              <p className="font-semibold">Dr. Anita Rao</p>
              <p className="text-[color:var(--nova-chrome-ink-2)]">
                Cardiology
              </p>
            </div>
          }
        >
          <NavItem href="#dashboard" icon={icons.dashboard} active>
            Dashboard
          </NavItem>
          <NavItem href="#patients" icon={icons.patients}>
            Patients
          </NavItem>
          <NavItem href="#appointments" icon={icons.appointments}>
            Appointments
          </NavItem>
          <NavItem href="#claims" icon={icons.claims}>
            Claims
          </NavItem>
          <NavItem href="#laboratory" icon={icons.laboratory}>
            Laboratory
          </NavItem>
          <NavItem href="#settings" icon={icons.settings}>
            Settings
          </NavItem>
        </Sidebar>
      }
    >
      <TopBar
        search={
          <SearchField
            label="Search patients, claims and orders"
            placeholder="Search patients, claims and orders"
            icon={icons.search}
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
      <div className="flex flex-col gap-6 p-6">
        <HeroBand
          title="Good morning, Dr. Rao"
          description="14 admissions are waiting for review and 3 claims need a reply today."
        />
        <Tabs value={tab} onValueChange={setTab}>
          <TabList aria-label="Ward overview">
            <Tab value="overview">Overview</Tab>
            <Tab value="claims">Claims</Tab>
            <Tab value="occupancy">Occupancy</Tab>
          </TabList>
          <TabPanel value="overview" className="mt-6">
            <Overview />
          </TabPanel>
          <TabPanel value="claims" className="mt-6 text-ink-2">
            Claims by scheme would list here.
          </TabPanel>
          <TabPanel value="occupancy" className="mt-6 text-ink-2">
            Occupancy by ward would list here.
          </TabPanel>
        </Tabs>
      </div>
    </AppShell>
  );
}

export const FullPage: StoryObj = { render: () => <ShellPage /> };
