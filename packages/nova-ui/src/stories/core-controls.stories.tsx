import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiBadge } from '../components/ai-badge/ai-badge';
import { Avatar } from '../components/avatar/avatar';
import { Button } from '../components/button/button';
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from '../components/card/card';
import { Checkbox } from '../components/checkbox/checkbox';
import { Chip } from '../components/chip/chip';
import { EmptyState } from '../components/empty-state/empty-state';
import { FilterChip } from '../components/filter-chip/filter-chip';
import { Radio } from '../components/radio/radio';
import { Select } from '../components/select/select';
import { Switch } from '../components/switch/switch';
import { Tab, TabList, TabPanel, Tabs } from '../components/tabs/tabs';
import { TextField } from '../components/text-field/text-field';
import { Textarea } from '../components/textarea/textarea';

const meta = {
  title: 'Design language/Core controls',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

// One page with every core control in every state, so the owner can set it beside the prototype
// (and Glass beside Solid, from the toolbar). The spec is docs/design-language/README.md, which makes
// os/public/assets/hos.css binding: Google Sans Flex, the 400 / 500 / 600 / 700 weights, the
// prototype's type sizes, the 8 / 12 / 18 / 22 radii and its violet-tinted shadows.

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[17px] font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] text-ink-3">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13 13l4 4" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" />
      <circle cx="7" cy="11" r="2" />
    </svg>
  );
}

function Filters() {
  const [active, setActive] = useState(['ICU']);
  return (
    <div role="group" aria-label="Wards" className="flex flex-wrap gap-1">
      {['ICU', 'Medicine', 'Surgery'].map((ward) => (
        <FilterChip
          key={ward}
          pressed={active.includes(ward)}
          onPressedChange={(on) =>
            setActive((current) =>
              on ? [...current, ward] : current.filter((w) => w !== ward),
            )
          }
        >
          {ward}
        </FilterChip>
      ))}
      <FilterChip disabled>Maternity</FilterChip>
    </div>
  );
}

function RoomChoice() {
  const rooms = ['General ward', 'Semi-private'];
  const [chosen, setChosen] = useState(rooms[1]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rooms.map((room) => (
        <Card
          key={room}
          interactive
          selected={room === chosen}
          className="has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-primary"
        >
          <label className="flex cursor-pointer flex-col gap-2 p-5">
            <span className="text-[17px] font-semibold text-ink">{room}</span>
            <span className="text-[13px] text-ink-3">
              {room === chosen ? 'Selected' : 'Interactive: press me'}
            </span>
            <input
              type="radio"
              name="core-room"
              checked={room === chosen}
              onChange={() => setChosen(room)}
              className="sr-only"
            />
          </label>
        </Card>
      ))}
    </div>
  );
}

export const CoreControls: StoryObj = {
  render: () => (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-[23px] font-semibold tracking-h1 text-ink">
          Core controls
        </h1>
        <p className="max-w-2xl text-[13px] text-ink-2">
          Every control as the HOS prototype draws it: Google Sans Flex, body
          text at 14px on a 1.55 line, form text at 13.5px, labels at 12px
          semibold, buttons at 13px semibold.
        </p>
      </header>

      <Section title="Type sizes">
        <div className="flex flex-col gap-1">
          <p className="font-display text-[26px] font-bold text-ink">
            KPI figure · 26 · 4,280
          </p>
          <p className="font-display text-[23px] font-semibold tracking-h1 text-ink">
            h1 · 23 · Good morning, Swapna
          </p>
          <p className="font-display text-[17px] font-semibold tracking-h2 text-ink">
            h2 · 17 · Now serving
          </p>
          <p className="text-[14px] text-ink">
            Body · 14 · Ramesh Kumar, bed 12
          </p>
          <p className="text-[13.5px] text-ink">Form and nav · 13.5</p>
          <p className="text-[13px] text-ink-2">Table, button, banner · 13</p>
          <p className="text-[12px] text-ink-2">Small print · 12 · .tiny</p>
          <p className="text-[11.5px] font-semibold text-ink-2">Chip · 11.5</p>
          <p className="text-[11px] font-semibold uppercase tracking-[.06em] text-ink-2">
            Table header · 11
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <Row label="Variants (md)">
          <Button>Admit patient</Button>
          <Button variant="outline">Edit</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Discharge</Button>
          <Button variant="ai">Draft summary</Button>
        </Row>
        <Row label="Small">
          <Button size="sm">Admit</Button>
          <Button size="sm" variant="outline">
            Edit
          </Button>
          <Button size="sm" variant="ghost">
            Cancel
          </Button>
          <Button size="sm" variant="danger">
            Discharge
          </Button>
          <Button size="sm" variant="ai">
            Draft
          </Button>
        </Row>
        <Row label="States: loading (keeps its width), disabled, unavailable but focusable">
          <Button loading>Saving record</Button>
          <Button variant="outline" loading>
            Saving record
          </Button>
          <Button disabled>Disabled</Button>
          <Button aria-disabled>Unavailable</Button>
        </Row>
        <div className="max-w-sm">
          <Button fullWidth>Sign in with mobile OTP</Button>
        </div>
      </Section>

      <Section title="Fields">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Patient name"
            placeholder="As on the ID card"
            hint="First and last name"
          />
          <TextField
            label="Search patients"
            placeholder="Name, UHID or phone"
            leadingIcon={<SearchIcon />}
          />
          <TextField
            label="Phone"
            required
            defaultValue="98765"
            error="Enter a 10-digit mobile number"
          />
          <TextField label="UHID" defaultValue="HOS-00412" disabled />
          <Select
            label="Ward"
            placeholder="Choose a ward"
            options={[
              { value: 'icu', label: 'ICU' },
              { value: 'med', label: 'Medicine' },
            ]}
          />
          <Textarea
            label="Clinical notes"
            placeholder="Presenting complaint, history…"
          />
        </div>
      </Section>

      <Section title="Choices">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col">
            <Checkbox label="Consent recorded" defaultChecked />
            <Checkbox label="Allergies reviewed" />
            <Checkbox label="Locked" disabled />
          </div>
          <fieldset className="flex flex-col">
            <legend className="text-[13px] font-semibold text-ink">
              Triage
            </legend>
            <Radio name="core-triage" label="Immediate" defaultChecked />
            <Radio name="core-triage" label="Urgent" />
            <Radio name="core-triage" label="Standard" disabled />
          </fieldset>
          <div className="flex flex-col">
            <Switch label="SMS reminders" defaultChecked />
            <Switch label="Isolation precautions" />
            <Switch label="Locked" disabled />
          </div>
        </div>
      </Section>

      <Section title="Chips">
        <Row label="Status chips (word plus tone, never colour alone)">
          <Chip>Pending</Chip>
          <Chip tone="good">Discharged</Chip>
          <Chip tone="warn">Query raised</Chip>
          <Chip tone="crit">Critical</Chip>
          <Chip tone="info">Pre-auth</Chip>
          <AiBadge />
        </Row>
        <Row label="Filter chips (toggle; press to 0.96)">
          <Filters />
        </Row>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="overview">
          <TabList aria-label="Patient record">
            <Tab value="overview">Overview</Tab>
            <Tab value="labs">Labs</Tab>
            <Tab value="billing">Billing</Tab>
            <Tab value="locked" disabled>
              Archived
            </Tab>
          </TabList>
          <TabPanel value="overview" className="pt-3 text-[14px] text-ink-2">
            Vitals stable since admission.
          </TabPanel>
          <TabPanel value="labs" className="pt-3 text-[14px] text-ink-2">
            Haemoglobin 11.2 g/dL.
          </TabPanel>
          <TabPanel value="billing" className="pt-3 text-[14px] text-ink-2">
            Pre-auth approved.
          </TabPanel>
        </Tabs>
      </Section>

      <Section title="Avatars">
        <Row label="20 · 32 · 40 · 48, and verified">
          <Avatar name="Asha Rao" size="xs" />
          <Avatar name="Asha Rao" size="sm" />
          <Avatar name="Asha Rao" size="md" />
          <Avatar name="Asha Rao" size="lg" />
          <Avatar name="Dr. Meera Iyer" size="lg" verified />
        </Row>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader title="Ward 4B" description="Medicine, second floor" />
            <CardBody className="text-[13px] text-ink-2">
              14 of 18 beds occupied.
            </CardBody>
            <CardFooter>
              <span>Updated 08:40</span>
              <Button size="sm" variant="ghost">
                Open ward
              </Button>
            </CardFooter>
          </Card>
          <Card variant="data">
            <CardHeader
              title="Collections"
              description="Dense data stays opaque"
            />
            <CardBody className="font-mono text-[23px] text-ink">
              ₹4.2L
            </CardBody>
          </Card>
        </div>
        <RoomChoice />
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={<BedIcon />}
          title="No beds free"
          description="Every bed in Ward 4B is occupied. Ramesh stays first on the waitlist."
          action={<Button>Open the waitlist</Button>}
        />
      </Section>
    </div>
  ),
};
