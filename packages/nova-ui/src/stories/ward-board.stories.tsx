import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActivityFeed } from '../components/activity-feed/activity-feed';
import { BedGrid, type Bed } from '../components/bed-grid/bed-grid';
import { BrandMark } from '../components/brand-mark/brand-mark';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { HeroBand } from '../components/hero-band/hero-band';
import { KpiTile } from '../components/kpi-tile/kpi-tile';
import {
  SectionNav,
  type SectionNavItem,
} from '../components/section-nav/section-nav';
import { SplitLayout } from '../components/split-layout/split-layout';
import {
  WorkspaceSwitcher,
  type WorkspaceGroup,
  type WorkspaceOption,
} from '../components/workspace-switcher/workspace-switcher';

// One realistic screen built from the navigation, identity and domain components, so they can be
// seen working together: chrome on the left (brand, workspace switcher, section nav), the ward
// board on the right (bed grid and activity feed in a split).

const meta = {
  title: 'Screens/Ward board',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const workspaces: WorkspaceGroup[] = [
  {
    label: 'Clinical',
    items: [
      { id: 'ipd', name: 'IPD', label: 'In-patients' },
      { id: 'nursing', name: 'Nursing' },
      { id: 'ot', name: 'Operation Theatre' },
      { id: 'er', name: 'Emergency', disabled: true },
    ],
  },
  {
    label: 'Money',
    items: [
      { id: 'billing', name: 'Billing' },
      { id: 'pharmacy', name: 'Pharmacy' },
    ],
  },
];

const beds: Bed[] = [
  {
    id: 'gm1',
    label: 'GM-01',
    status: 'occupied',
    patient: 'Ramesh',
    ward: 'General',
  },
  { id: 'gm2', label: 'GM-02', status: 'free', ward: 'General' },
  {
    id: 'gm3',
    label: 'GM-03',
    status: 'occupied',
    patient: 'Irfan',
    ward: 'General',
  },
  { id: 'gm4', label: 'GM-04', status: 'cleaning', ward: 'General' },
  {
    id: 'gm5',
    label: 'GM-05',
    status: 'occupied',
    patient: 'Srinivas',
    ward: 'General',
  },
  { id: 'gm6', label: 'GM-06', status: 'free', ward: 'General' },
  {
    id: 'gf1',
    label: 'GF-01',
    status: 'occupied',
    patient: 'Lakshmi',
    ward: 'General',
  },
  { id: 'gf2', label: 'GF-02', status: 'blocked', ward: 'General' },
  {
    id: 'gf3',
    label: 'GF-03',
    status: 'occupied',
    patient: 'Padma',
    ward: 'General',
  },
  { id: 'gf4', label: 'GF-04', status: 'free', ward: 'General' },
  {
    id: 'sp1',
    label: 'SP-01',
    status: 'occupied',
    patient: 'Narayana',
    ward: 'Semi-private',
  },
  { id: 'sp2', label: 'SP-02', status: 'cleaning', ward: 'Semi-private' },
];

function count(status: Bed['status']) {
  return beds.filter((bed) => bed.status === status).length;
}

function WardBoard() {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceOption>({
    id: 'ipd',
    name: 'IPD',
    label: 'In-patients',
  });
  const [section, setSection] = useState('beds');
  const [selected, setSelected] = useState<string | null>(null);

  const sections: SectionNavItem[] = [
    {
      id: 'beds',
      label: 'Bed board',
      icon: (
        <Glyph>
          <path d="M3 19V8" />
          <path d="M3 12h13a5 5 0 0 1 5 5v2" />
          <path d="M3 19h18" />
          <circle cx="8" cy="8.5" r="2.2" />
        </Glyph>
      ),
    },
    {
      id: 'admissions',
      label: 'Admissions',
      icon: (
        <Glyph>
          <path d="M14 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
        </Glyph>
      ),
      badge: 4,
      badgeLabel: 'waiting',
    },
    {
      id: 'discharges',
      label: 'Discharges',
      icon: (
        <Glyph>
          <path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </Glyph>
      ),
      badge: 2,
      badgeLabel: 'due today',
    },
    {
      id: 'handover',
      label: 'Shift handover',
      icon: (
        <Glyph>
          <path d="M3 12h4l2.5-7 4 14 2.5-7h5" />
        </Glyph>
      ),
      disabled: true,
    },
  ].map((item) => ({ ...item, active: item.id === section }));

  const picked = beds.find((bed) => bed.id === selected);

  return (
    <div className="grid min-h-[36rem] md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="nova-chrome flex flex-col gap-4 p-3">
        <BrandMark name="HOS" sub="Hospital OS" href="#home" />
        <WorkspaceSwitcher
          current={workspace}
          groups={workspaces}
          open={switcherOpen}
          onOpenChange={setSwitcherOpen}
          onSelect={(id) => {
            const next = workspaces
              .flatMap((group) => group.items)
              .find((item) => item.id === id);
            if (next) setWorkspace(next);
          }}
          hint="Switch workspace"
        />
        <SectionNav
          ariaLabel={`${workspace.name} sections`}
          items={sections}
          onSelect={setSection}
        />
      </aside>

      <main className="min-w-0 space-y-4 p-6">
        <HeroBand
          title={`${workspace.name} ward board`}
          description="Press a bed to open it"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiTile label="Free beds" value={count('free')} tone="good" />
            <KpiTile label="Occupied" value={count('occupied')} />
            <KpiTile
              label="Being cleaned"
              value={count('cleaning')}
              tone="warn"
            />
          </div>
        </HeroBand>
        <SplitLayout
          ratio="2-1"
          primary={
            <Card>
              <CardHeader
                title="Beds"
                description="General and semi-private wards"
              />
              <CardBody className="space-y-3">
                <BedGrid
                  beds={beds}
                  ariaLabel="General ward beds"
                  onSelect={setSelected}
                />
                <p role="status" className="text-callout text-ink-2">
                  {picked
                    ? `Selected bed ${picked.label}, ${picked.status}`
                    : 'No bed selected'}
                </p>
              </CardBody>
            </Card>
          }
          secondary={
            <section aria-labelledby="activity-heading" className="space-y-2">
              <h2
                id="activity-heading"
                className="text-body font-semibold text-ink"
              >
                Activity
              </h2>
              <ActivityFeed
                aria-label="Ward activity"
                items={[
                  {
                    id: '1',
                    time: '09:12 AM',
                    title: 'Bed GM-04 vacated',
                    detail: 'Sent for cleaning',
                  },
                  {
                    id: '2',
                    time: '08:40 AM',
                    title: 'Discharge summary filed',
                    tone: 'good',
                  },
                  {
                    id: '3',
                    time: '07:48 AM',
                    title: 'Ramesh moved to ICU',
                    detail: 'Approved by the ward consultant',
                    tone: 'warn',
                  },
                  {
                    id: '4',
                    time: '07:15 AM',
                    title: 'Monitor alarm in bed SP-01',
                    tone: 'crit',
                  },
                  {
                    id: '5',
                    time: '06:30 AM',
                    title: 'Handover note drafted',
                    detail: 'Awaiting nurse review',
                    tone: 'ai',
                  },
                ]}
              />
            </section>
          }
        />
      </main>
    </div>
  );
}

export const WardBoardScreen: StoryObj = {
  name: 'Ward board',
  render: () => <WardBoard />,
};
