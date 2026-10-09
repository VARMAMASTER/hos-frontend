import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { AiButton } from '../components/ai-button/ai-button';
import { AiPanel } from '../components/ai-panel/ai-panel';
import { AppShell } from '../components/app-shell/app-shell';
import { Button } from '../components/button/button';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { Chip } from '../components/chip/chip';
import { HeroBand } from '../components/hero-band/hero-band';
import { KpiTile } from '../components/kpi-tile/kpi-tile';
import { SearchField } from '../components/search-field/search-field';
import { NavItem } from '../components/sidebar/nav-item';
import { Sidebar } from '../components/sidebar/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../components/table/table';
import { TopBar } from '../components/top-bar/top-bar';

// One page with every brand-dependent surface on it: the sidebar, the top bar, the hero, the canvas,
// cards, a table and an AI block. Flip Hospital theme, Material and Scheme in the toolbar: a preset
// recolours the whole frame, dark mode turns the content dark while the chrome stays the brand's,
// and frost and solid change only the glass.
const meta = {
  title: 'Themes/Preview',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

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

const grid = (
  <Icon>
    <rect x="3" y="3" width="5.5" height="5.5" rx="1.2" />
    <rect x="11.5" y="3" width="5.5" height="5.5" rx="1.2" />
    <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.2" />
    <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.2" />
  </Icon>
);
const person = (
  <Icon>
    <circle cx="10" cy="6.5" r="3" />
    <path d="M3.5 17c.6-3.2 3.2-5 6.5-5s5.9 1.8 6.5 5" />
  </Icon>
);
const page = (
  <Icon>
    <path d="M5.5 3h6L15 6.5V16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 .5-1z" />
  </Icon>
);

const admissions = [
  { patient: 'Ramesh Kumar', ward: 'ICU', bed: 'ICU-04', status: 'crit' },
  { patient: 'Lakshmi Iyer', ward: 'General', bed: 'G-112', status: 'good' },
  { patient: 'Arjun Mehta', ward: 'Maternity', bed: 'M-07', status: 'warn' },
  {
    patient: 'Fatima Shaikh',
    ward: 'Paediatrics',
    bed: 'P-21',
    status: 'info',
  },
] as const;

const STATUS_WORDS = {
  crit: 'Critical',
  good: 'Stable',
  warn: 'Watch',
  info: 'Admitted',
} as const;

function PreviewPage() {
  return (
    <AppShell
      sidebar={
        <Sidebar
          brand={
            <span className="flex items-center gap-s3 text-body font-semibold">
              <span className="grid size-s9 place-items-center rounded-card bg-primary text-control text-on-primary">
                H
              </span>
              Acme Hospital
            </span>
          }
        >
          <NavItem href="#dashboard" icon={grid} active>
            Dashboard
          </NavItem>
          <NavItem href="#patients" icon={person}>
            Patients
          </NavItem>
          <NavItem href="#claims" icon={page}>
            Claims
          </NavItem>
        </Sidebar>
      }
    >
      <TopBar
        search={
          <SearchField
            label="Search patients"
            placeholder="Search patients, claims and orders"
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
      <div className="flex flex-col gap-s8 p-s8">
        <HeroBand
          title="Good morning, Dr. Rao"
          description="14 admissions are waiting for review and 3 claims need a reply today."
          actions={
            <>
              <Button variant="ghost">Later</Button>
              <Button>Review admissions</Button>
            </>
          }
        />
        <div className="grid gap-s6 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="Bed occupancy"
            value="82%"
            delta="3 points up"
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
            label="Denials"
            value="9"
            delta="3 more than yesterday"
            trend="up"
            tone="crit"
          />
        </div>
        <div className="grid gap-s6 lg:grid-cols-2">
          <Card variant="data">
            <CardHeader
              title="Today's admissions"
              description="Sorted by acuity"
            />
            <Table caption="Today's admissions">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Patient</TableHeaderCell>
                  <TableHeaderCell>Ward</TableHeaderCell>
                  <TableHeaderCell>Bed</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {admissions.map((row) => (
                  <TableRow key={row.bed}>
                    <TableCell>{row.patient}</TableCell>
                    <TableCell>{row.ward}</TableCell>
                    <TableCell>{row.bed}</TableCell>
                    <TableCell>
                      <Chip tone={row.status}>{STATUS_WORDS[row.status]}</Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="flex flex-col gap-s6">
            <AiPanel
              title="Discharge summary draft"
              footer={
                <div className="flex gap-s3">
                  <AiButton size="sm">
                    Approve
                  </AiButton>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              }
            >
              Ramesh Kumar, 58, admitted with chest pain; troponin negative
              twice, discharged on aspirin with a cardiology follow-up in two
              weeks.
            </AiPanel>
            <Card variant="glass">
              <CardHeader
                title="Glass panel"
                description="Frosts on glass and frost, opaque on solid"
                actions={<Chip tone="info">Ward 4B</Chip>}
              />
              <CardBody className="flex flex-wrap gap-s3">
                <Chip tone="good">5 filed</Chip>
                <Chip tone="warn">2 queries</Chip>
                <Chip>8 pending</Chip>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export const Preview: StoryObj = { render: () => <PreviewPage /> };
