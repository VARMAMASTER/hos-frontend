import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Avatar } from '../components/avatar/avatar';
import { Banner } from '../components/banner/banner';
import { Button } from '../components/button/button';
import {
  ButtonGroup,
  ButtonGroupItem,
} from '../components/button-group/button-group';
import { Card, CardBody, CardHeader } from '../components/card/card';
import {
  ChoiceCard,
  ChoiceCardGroup,
} from '../components/choice-card/choice-card';
import { Chip } from '../components/chip/chip';
import { DataTable } from '../components/data-table/data-table';
import { HeroBand } from '../components/hero-band/hero-band';
import { KpiTile } from '../components/kpi-tile/kpi-tile';
import { StatGauge } from '../components/stat-gauge/stat-gauge';
import { Tab, TabList, TabPanel, Tabs } from '../components/tabs/tabs';
import { Tag } from '../components/tag/tag';
import { Timeline } from '../components/timeline/timeline';
import { NovaThemeProvider } from '../theme/theme-provider';
import { EXAMPLE_THEMES } from './example-themes';

const meta = { title: 'Design language/Highlights' } satisfies Meta;

export default meta;

// A fixed "now", so the timeline's relative times never drift between screenshots.
const NOW = '2026-10-07T10:30:00+05:30';

interface Patient {
  id: string;
  name: string;
  ward: string;
  los: number;
}

const PATIENTS: Patient[] = [
  { id: 'p1', name: 'Ramesh Kumar', ward: 'ICU', los: 6 },
  { id: 'p2', name: 'Asha Rao', ward: 'General', los: 3 },
  { id: 'p3', name: 'Meera Iyer', ward: 'Ortho', los: 2 },
];

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} description={note} headingLevel={3} />
      <CardBody className="flex flex-col gap-4">{children}</CardBody>
    </Card>
  );
}

// Every place the highlight is used, as a product screen would use it: the brand leads, the
// highlight is the second accent beside it, and no ordinary button carries a gradient.
function Showcase() {
  return (
    <div className="flex flex-col gap-4">
      <HeroBand
        title="Highlights"
        description="The hero's glow stop is this hospital's highlight; white text holds 4.5:1 across it."
        actions={
          <>
            <Button variant="ghost" size="sm">
              Ordinary buttons stay solid
            </Button>
            <Button size="sm">Primary</Button>
          </>
        }
      />
      <Banner tone="highlight" title="New in this release">
        Discharge summaries now draft themselves from the ward round notes.
      </Banner>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiTile
          highlight
          label="Collections today"
          value="₹4.2L"
          delta="+12%"
          trend="up"
          tone="good"
        />
        <KpiTile label="Beds free" value="14" delta="−2" trend="down" />
        <StatGauge
          label="Beds occupied"
          value={42}
          max={60}
          valueText="42 of 60"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Tabs and choices"
          note="The active tab's underline, a selected segment, a chosen card"
        >
          <Tabs defaultValue="claims">
            <TabList aria-label="Admission">
              <Tab value="overview">Overview</Tab>
              <Tab value="claims">Claims</Tab>
              <Tab value="notes">Notes</Tab>
            </TabList>
            <TabPanel value="overview" className="pt-3 text-[13px] text-ink-2">
              Overview
            </TabPanel>
            <TabPanel value="claims" className="pt-3 text-[13px] text-ink-2">
              Two claims are waiting on the insurer.
            </TabPanel>
            <TabPanel value="notes" className="pt-3 text-[13px] text-ink-2">
              Notes
            </TabPanel>
          </Tabs>
          <ButtonGroup aria-label="Range" defaultValue="week">
            <ButtonGroupItem value="day">Day</ButtonGroupItem>
            <ButtonGroupItem value="week">Week</ButtonGroupItem>
            <ButtonGroupItem value="month">Month</ButtonGroupItem>
          </ButtonGroup>
          <ButtonGroup
            aria-label="Wards"
            type="multiple"
            defaultValue={['icu', 'ortho']}
            size="sm"
          >
            <ButtonGroupItem value="icu">ICU</ButtonGroupItem>
            <ButtonGroupItem value="general">General</ButtonGroupItem>
            <ButtonGroupItem value="ortho">Ortho</ButtonGroupItem>
          </ButtonGroup>
          <ChoiceCardGroup
            legend="Admission type"
            name="admission"
            defaultValue="planned"
            columns={2}
          >
            <ChoiceCard
              value="planned"
              title="Planned"
              description="Booked ahead"
            />
            <ChoiceCard
              value="emergency"
              title="Emergency"
              description="Via casualty"
            />
          </ChoiceCardGroup>
        </Section>
        <Section
          title="Chips, tags and people"
          note="A star marker, never colour alone"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="highlight">New</Chip>
            <Chip tone="highlight">Featured clinic</Chip>
            <Chip tone="info">Info stays a status</Chip>
            <Tag tone="highlight">Beta</Tag>
            <Tag tone="highlight" variant="outline">
              Pilot
            </Tag>
          </div>
          <div className="flex items-center gap-4">
            <Avatar name="Dr. Meera Iyer" highlight highlightLabel="On call" />
            <Avatar name="Asha Rao" />
            <span className="text-[13px] text-ink-2">
              The ringed clinician is on call (announced as "On call").
            </span>
          </div>
        </Section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Data"
          note="A selected row's rail, the sorted column's marker"
        >
          <DataTable<Patient>
            caption="Patients on the ward"
            rows={PATIENTS}
            getRowId={(row) => row.id}
            getRowLabel={(row) => row.name}
            selectable
            defaultSelectedRowIds={['p1']}
            defaultSort={{ columnId: 'los', direction: 'desc' }}
            columns={[
              {
                id: 'name',
                header: 'Patient',
                accessor: (row) => row.name,
                sortable: true,
              },
              { id: 'ward', header: 'Ward', accessor: (row) => row.ward },
              {
                id: 'los',
                header: 'Days',
                accessor: (row) => row.los,
                numeric: true,
                sortable: true,
              },
            ]}
          />
        </Section>
        <Section
          title="Timeline"
          note="Milestones carry the highlight node, its star and the word"
        >
          <Timeline
            now={NOW}
            items={[
              {
                id: 'discharge',
                at: '2026-10-07T09:10:00+05:30',
                title: 'Discharged home',
                milestone: true,
              },
              {
                id: 'vitals',
                at: '2026-10-07T07:45:00+05:30',
                title: 'Vitals recorded',
              },
              {
                id: 'surgery',
                at: '2026-10-05T14:00:00+05:30',
                title: 'Knee replacement',
                tone: 'good',
                milestone: true,
              },
            ]}
          />
        </Section>
      </div>
    </div>
  );
}

// Follows the toolbar: switch the hospital theme, the material and the scheme.
export const Highlights: StoryObj = {
  render: () => (
    <div className="p-2">
      <Showcase />
    </div>
  ),
};

// A compact strip of the highlight in every preset, in both schemes at once, whatever the toolbar
// says.
function Strip() {
  return (
    <div className="flex flex-col gap-3">
      <Banner tone="highlight" title="New in this release" />
      <div className="grid grid-cols-2 gap-3">
        <KpiTile highlight label="Collections" value="₹4.2L" />
        <StatGauge label="Occupied" value={42} max={60} valueText="42 of 60" />
      </div>
      <Tabs defaultValue="claims">
        <TabList aria-label="Admission">
          <Tab value="overview">Overview</Tab>
          <Tab value="claims">Claims</Tab>
        </TabList>
      </Tabs>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="highlight">New</Chip>
        <Tag tone="highlight">Beta</Tag>
        <Avatar name="Asha Rao" size="sm" highlight />
        <ButtonGroup aria-label="Range" defaultValue="week" size="sm">
          <ButtonGroupItem value="day">Day</ButtonGroupItem>
          <ButtonGroupItem value="week">Week</ButtonGroupItem>
        </ButtonGroup>
      </div>
    </div>
  );
}

export const EveryPreset: StoryObj = {
  name: 'Every preset, light and dark',
  render: () => (
    <div className="grid gap-4 p-2 lg:grid-cols-2">
      {Object.values(EXAMPLE_THEMES).flatMap((theme) =>
        (['light', 'dark'] as const).map((scheme) => (
          <NovaThemeProvider
            key={`${theme.name}-${scheme}`}
            theme={theme}
            scheme={scheme}
            className="nova-canvas flex flex-col gap-3 rounded-lg p-4 text-ink"
          >
            <p className="text-[13px] font-semibold">
              {theme.name}, {scheme}
            </p>
            <Strip />
          </NovaThemeProvider>
        )),
      )}
    </div>
  ),
};
