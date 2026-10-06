import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../components/avatar/avatar';
import { Button } from '../components/button/button';
import {
  ButtonGroup,
  ButtonGroupItem,
} from '../components/button-group/button-group';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { Checkbox } from '../components/checkbox/checkbox';
import { Chip } from '../components/chip/chip';
import {
  ChoiceCard,
  ChoiceCardGroup,
} from '../components/choice-card/choice-card';
import { FilterChip } from '../components/filter-chip/filter-chip';
import { Radio } from '../components/radio/radio';
import { Switch } from '../components/switch/switch';

const meta = {
  title: 'Design language/Choices and chips',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

// Every choice control in every state, and the clinical form that uses them together. Colours, type
// and tokens are the prototype's (os/public/assets/hos.css); the shapes and motion are the 2026 ones:
// Material 3 Expressive's corner morph, connected button groups and sliding check, and the iOS 26
// switch. Flip the toolbar between Glass and Solid, and set the system to "reduce motion" to see every
// state change instantly. Press and hold a control to see it respond.

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

function Glyph({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const LIST = 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01';
const GRID = 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z';
const MAP = 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14';
const SIREN = 'M12 3v2M5 12a7 7 0 0 1 14 0v5H5zM3 21h18';
const CAL = 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4';
const SUN =
  'M12 4V2M12 22v-2M4 12H2M22 12h-2M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z';

function InputChips() {
  const [tags, setTags] = useState(['Cardiology', 'Nephrology', 'Dr Rao']);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Chip
          key={tag}
          tone="info"
          onRemove={() =>
            setTags((current) => current.filter((t) => t !== tag))
          }
        >
          {tag}
        </Chip>
      ))}
      {tags.length === 0 ? (
        <span className="text-[12.5px] text-ink-2">
          No referrals. Press Backspace on a focused chip to remove it.
        </span>
      ) : null}
    </div>
  );
}

function SelectableChips() {
  const [picked, setPicked] = useState('Medicine');
  return (
    <div className="flex flex-wrap items-center gap-2">
      {['ICU', 'Medicine', 'Surgery'].map((ward) => (
        <button
          key={ward}
          type="button"
          aria-pressed={picked === ward}
          onClick={() => setPicked(ward)}
          className="cursor-pointer rounded-full"
        >
          <Chip tone="info" selected={picked === ward}>
            {ward}
          </Chip>
        </button>
      ))}
    </div>
  );
}

function WardFilters({ label }: { label: string }) {
  const wards = ['ICU', 'Medicine', 'Surgery', 'Paediatrics'];
  const [active, setActive] = useState(['ICU']);
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {wards.map((ward) => (
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

function Groups() {
  const [view, setView] = useState('list');
  const [shifts, setShifts] = useState(['day']);
  return (
    <div className="flex flex-col gap-6">
      <Row label="Single select: radio group, roving tabindex, arrow keys. The fill slides; corners morph.">
        <ButtonGroup aria-label="Bed view" value={view} onValueChange={setView}>
          <ButtonGroupItem value="list" icon={<Glyph d={LIST} />}>
            List
          </ButtonGroupItem>
          <ButtonGroupItem value="grid" icon={<Glyph d={GRID} />}>
            Grid
          </ButtonGroupItem>
          <ButtonGroupItem value="map" icon={<Glyph d={MAP} />}>
            Floor map
          </ButtonGroupItem>
        </ButtonGroup>
        <span className="text-[12.5px] text-ink-2" aria-live="polite">
          Showing the {view === 'map' ? 'floor map' : view}.
        </span>
      </Row>
      <Row label="Small, icon only (named by aria-label)">
        <ButtonGroup aria-label="Density" size="sm" defaultValue="list">
          <ButtonGroupItem
            value="list"
            aria-label="List"
            icon={<Glyph d={LIST} />}
          />
          <ButtonGroupItem
            value="grid"
            aria-label="Grid"
            icon={<Glyph d={GRID} />}
          />
          <ButtonGroupItem
            value="map"
            aria-label="Map"
            icon={<Glyph d={MAP} />}
          />
        </ButtonGroup>
        <ButtonGroup aria-label="Range" size="sm" defaultValue="7d">
          <ButtonGroupItem value="24h">24 h</ButtonGroupItem>
          <ButtonGroupItem value="7d">7 days</ButtonGroupItem>
          <ButtonGroupItem value="30d">30 days</ButtonGroupItem>
        </ButtonGroup>
      </Row>
      <Row label="Multiple select: toggle buttons (aria-pressed), a tick slides in">
        <ButtonGroup
          type="multiple"
          aria-label="Shifts"
          value={shifts}
          onValueChange={setShifts}
        >
          <ButtonGroupItem value="day" icon={<Glyph d={SUN} />}>
            Day
          </ButtonGroupItem>
          <ButtonGroupItem value="evening">Evening</ButtonGroupItem>
          <ButtonGroupItem value="night">Night</ButtonGroupItem>
        </ButtonGroup>
      </Row>
      <Row label="With a disabled segment, and disabled as a whole">
        <ButtonGroup aria-label="Export" defaultValue="pdf">
          <ButtonGroupItem value="pdf">PDF</ButtonGroupItem>
          <ButtonGroupItem value="csv" disabled>
            CSV
          </ButtonGroupItem>
          <ButtonGroupItem value="print">Print</ButtonGroupItem>
        </ButtonGroup>
        <ButtonGroup aria-label="Locked" disabled defaultValue="a">
          <ButtonGroupItem value="a">One</ButtonGroupItem>
          <ButtonGroupItem value="b">Two</ButtonGroupItem>
        </ButtonGroup>
      </Row>
    </div>
  );
}

function Cards() {
  const [needs, setNeeds] = useState(['oxygen']);
  return (
    <div className="flex flex-col gap-6">
      <ChoiceCardGroup
        legend="Admission type"
        name="cards-admission"
        columns={3}
        defaultValue="planned"
      >
        <ChoiceCard
          value="emergency"
          title="Emergency"
          description="Unplanned. Needs a bed now."
          icon={<Glyph d={SIREN} />}
          badge={<Chip tone="crit">Urgent</Chip>}
        />
        <ChoiceCard
          value="planned"
          title="Planned"
          description="Booked ahead with a consultant."
          icon={<Glyph d={CAL} />}
        />
        <ChoiceCard
          value="daycare"
          title="Day care"
          description="Home the same evening."
          icon={<Glyph d={SUN} />}
          disabled
        />
      </ChoiceCardGroup>
      <ChoiceCardGroup
        type="multiple"
        legend="Care needs (choose any)"
        name="cards-needs"
        columns={2}
        value={needs}
        onValueChange={setNeeds}
      >
        <ChoiceCard
          value="oxygen"
          title="Oxygen"
          description="Piped oxygen at the bedside."
        />
        <ChoiceCard
          value="isolation"
          title="Isolation room"
          description="Negative pressure, anteroom."
          badge={<Chip tone="warn">Limited</Chip>}
        />
      </ChoiceCardGroup>
    </div>
  );
}

function ClinicalForm() {
  const [admission, setAdmission] = useState('planned');
  const [view, setView] = useState('list');
  const [wards, setWards] = useState(['Medicine']);
  const [consent, setConsent] = useState(true);
  const allWards = ['ICU', 'Medicine', 'Surgery'];
  return (
    <Card className="max-w-3xl">
      <CardHeader
        title="Admit Ramesh Kumar"
        description="UHID 20-4471 · 58 years · Male"
      />
      <CardBody className="flex flex-col gap-6">
        <ChoiceCardGroup
          legend="Admission type"
          name="form-admission"
          columns={3}
          value={admission}
          onValueChange={setAdmission}
        >
          <ChoiceCard
            value="emergency"
            title="Emergency"
            description="Needs a bed now."
            icon={<Glyph d={SIREN} />}
          />
          <ChoiceCard
            value="planned"
            title="Planned"
            description="Booked ahead."
            icon={<Glyph d={CAL} />}
          />
          <ChoiceCard
            value="daycare"
            title="Day care"
            description="Home this evening."
            icon={<Glyph d={SUN} />}
          />
        </ChoiceCardGroup>

        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold text-ink">Wards to search</p>
          <div className="flex flex-wrap items-center gap-2">
            <Checkbox
              label="All wards"
              checked={wards.length === allWards.length}
              indeterminate={wards.length > 0 && wards.length < allWards.length}
              onChange={(event) =>
                setWards(event.target.checked ? allWards : [])
              }
            />
          </div>
          <div role="group" aria-label="Wards" className="flex flex-wrap gap-2">
            {allWards.map((ward) => (
              <FilterChip
                key={ward}
                pressed={wards.includes(ward)}
                onPressedChange={(on) =>
                  setWards((current) =>
                    on ? [...current, ward] : current.filter((w) => w !== ward),
                  )
                }
              >
                {ward}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-ink">Bed list</span>
            <ButtonGroup
              aria-label="Bed list view"
              size="sm"
              value={view}
              onValueChange={setView}
            >
              <ButtonGroupItem value="list" icon={<Glyph d={LIST} />}>
                List
              </ButtonGroupItem>
              <ButtonGroupItem value="grid" icon={<Glyph d={GRID} />}>
                Grid
              </ButtonGroupItem>
            </ButtonGroup>
          </div>
          <Switch
            label="Send SMS to family"
            checked={consent}
            onCheckedChange={setConsent}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost">Cancel</Button>
          <Button>Admit patient</Button>
        </div>
      </CardBody>
    </Card>
  );
}

export const Choices: StoryObj = {
  render: () => (
    <div className="flex max-w-5xl flex-col gap-10 p-8">
      <Section title="Chip">
        <Row label="Status tones: soft and deep pairs, always a word">
          <Chip>Pending</Chip>
          <Chip tone="good">Filed</Chip>
          <Chip tone="warn">Query raised</Chip>
          <Chip tone="crit">Denied</Chip>
          <Chip tone="info">Pre-auth</Chip>
          <Chip tone="ai">AI draft</Chip>
        </Row>
        <Row label="Leading icon and avatar">
          <Chip tone="good" icon={<Glyph d="M5 13l4 4L19 7" />}>
            Cleared
          </Chip>
          <Chip
            tone="warn"
            icon={<Glyph d="M12 8v5M12 17h.01M4 20h16L12 4z" />}
          >
            Allergy
          </Chip>
          <Chip avatar={<Avatar size="xs" name="Anita Rao" />}>Dr Rao</Chip>
        </Row>
        <Row label="Selected: a tick and a ring, and the word is spoken">
          <Chip selected>Medicine</Chip>
          <Chip tone="info" selected>
            Cardiology
          </Chip>
        </Row>
        <Row label="Selectable (Chip inside a button), pick one">
          <SelectableChips />
        </Row>
        <Row label="Input chips: remove with the cross or Backspace / Delete when focused">
          <InputChips />
        </Row>
      </Section>

      <Section title="Filter chip">
        <Row label="Off, on, disabled: corners morph, the tick slides in, it scales under the finger">
          <FilterChip>ICU</FilterChip>
          <FilterChip defaultPressed>Medicine</FilterChip>
          <FilterChip disabled>Surgery</FilterChip>
          <FilterChip disabled defaultPressed>
            Maternity
          </FilterChip>
        </Row>
        <Row label="A filter row">
          <WardFilters label="Ward filters" />
        </Row>
      </Section>

      <Section title="Button group">
        <Groups />
      </Section>

      <Section title="Choice card">
        <Cards />
      </Section>

      <Section title="Checkbox, radio and switch">
        <div className="grid gap-6 md:grid-cols-3">
          <Row label="Checkbox: the tick draws in">
            <Checkbox label="Unchecked" />
            <Checkbox label="Checked" defaultChecked />
            <Checkbox label="Indeterminate" indeterminate />
            <Checkbox label="Disabled" disabled />
            <Checkbox label="Disabled, checked" disabled defaultChecked />
          </Row>
          <Row label="Radio: the dot grows in">
            <fieldset className="flex flex-col">
              <legend className="sr-only">Sex</legend>
              <Radio name="choices-sex" label="Female" defaultChecked />
              <Radio name="choices-sex" label="Male" />
              <Radio name="choices-sex" label="Prefer not to say" disabled />
            </fieldset>
          </Row>
          <Row label="Switch: a check shows on, the thumb stretches when pressed">
            <Switch label="Off" />
            <Switch label="On" defaultChecked />
            <Switch label="Disabled" disabled />
            <Switch label="Disabled, on" disabled defaultChecked />
          </Row>
        </div>
      </Section>

      <Section title="A clinical form">
        <ClinicalForm />
      </Section>
    </div>
  ),
};
