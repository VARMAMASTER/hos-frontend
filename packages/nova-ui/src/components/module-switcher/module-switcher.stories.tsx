import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { ModuleSwitcher, type ModuleOption } from './module-switcher';

// The HOS modules, as the prototype's shell lists them (os/public/assets/shell.js). Each tile shows
// the module's initials, as the prototype does; pass `icon` for an svg instead.
const CLINICAL = 'Clinical';
const SUPPORT = 'Pharmacy and lab';
const MONEY = 'Money';
const INTELLIGENCE = 'Intelligence';
const GOVERNANCE = 'Governance';
const SETTINGS = 'Settings';

const hosModules: ModuleOption[] = [
  {
    id: 'reception',
    label: 'Reception / OPD',
    group: CLINICAL,
    keywords: ['OPD', 'front desk'],
  },
  { id: 'doctor', label: 'Doctor', group: CLINICAL },
  {
    id: 'patient-record',
    label: 'Patient Record',
    group: CLINICAL,
    keywords: ['chart', 'EMR'],
  },
  {
    id: 'ipd',
    label: 'IPD',
    group: CLINICAL,
    description: 'In-patients',
    keywords: ['ward', 'beds'],
  },
  {
    id: 'nursing',
    label: 'Nursing',
    group: CLINICAL,
    badge: 4,
    badgeLabel: '4 tasks due',
  },
  {
    id: 'ot',
    label: 'Operation Theatre',
    group: CLINICAL,
    keywords: ['OT', 'surgery'],
  },
  {
    id: 'emergency',
    label: 'Emergency',
    group: CLINICAL,
    keywords: ['ER', 'casualty'],
  },
  { id: 'pharmacy', label: 'Pharmacy', group: SUPPORT },
  {
    id: 'lab',
    label: 'Laboratory',
    group: SUPPORT,
    keywords: ['Lab', 'pathology'],
  },
  { id: 'billing', label: 'Billing', group: MONEY },
  {
    id: 'insurance',
    label: 'Insurance & Claims',
    group: MONEY,
    badge: 12,
    badgeLabel: '12 claims waiting',
    keywords: ['TPA', 'pre-auth'],
  },
  { id: 'analytics', label: 'Analytics', group: INTELLIGENCE },
  { id: 'workforce', label: 'AI Workforce', group: INTELLIGENCE, ai: true },
  {
    id: 'quality',
    label: 'Quality & Safety',
    group: GOVERNANCE,
    keywords: ['NABH'],
  },
  { id: 'admin', label: 'Administration', group: SETTINGS },
  { id: 'superadmin', label: 'Super Admin', group: SETTINGS },
];

// What a bedside nurse may open. The modules she cannot are marked hidden, so they are not in the
// menu at all (not greyed out), not in her recents, and not found by the filter.
const nurseModules: ModuleOption[] = hosModules.map((module) => {
  const allowed = ['nursing', 'ipd', 'patient-record', 'pharmacy', 'lab'];
  return allowed.includes(module.id) ? module : { ...module, hidden: true };
});

const decorate: Decorator = (Story) => (
  <div className="nova-chrome h-(--nova-measure-3xl) w-sidebar rounded-overlay p-s5">
    <Story />
  </div>
);

const meta = {
  title: 'Components/ModuleSwitcher',
  component: ModuleSwitcher,
  parameters: { layout: 'padded' },
  // The trigger is made for the dark sidebar; the menu is a light overlay.
  decorators: [decorate],
  args: { modules: hosModules, current: 'ipd' },
} satisfies Meta<typeof ModuleSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled({
  startOpen,
  modules,
  recent,
  startAt,
}: {
  startOpen: boolean;
  modules: ModuleOption[];
  recent?: string[];
  startAt: string;
}) {
  const [open, setOpen] = useState(startOpen);
  const [current, setCurrent] = useState(startAt);
  return (
    <ModuleSwitcher
      modules={modules}
      current={current}
      recent={recent}
      open={open}
      onOpenChange={setOpen}
      onSelect={setCurrent}
      hint="Switch module"
    />
  );
}

export const Closed: Story = {
  render: () => (
    <Controlled startOpen={false} modules={hosModules} startAt="ipd" />
  ),
};

// Every HOS module, in its group. Type to filter ("opd", "nabh", "claims"), ArrowDown and ArrowUp to
// move, Enter to choose, Escape to close. Operation Theatre is shown unavailable, not hidden.
export const AllHosModules: Story = {
  name: 'All HOS modules (open)',
  render: () => (
    <Controlled
      startOpen
      modules={hosModules.map((module) =>
        module.id === 'ot' ? { ...module, disabled: true } : module,
      )}
      startAt="ipd"
    />
  ),
};

// A user who may open five modules sees five: the rest are not rendered, so there is nothing to
// click that would only say no.
export const RestrictedPermissions: Story = {
  name: 'Restricted permissions (a ward nurse)',
  render: () => (
    <Controlled startOpen modules={nurseModules} startAt="nursing" />
  ),
};

// Recent modules lead the menu, in the order used, and are not repeated in their own group.
export const WithRecents: Story = {
  name: 'With recent modules',
  render: () => (
    <Controlled
      startOpen
      modules={hosModules}
      recent={['patient-record', 'billing', 'lab']}
      startAt="patient-record"
    />
  ),
};

// Keeps its own open state. The AI module wears the AI tile, so it is told apart by more than colour.
export const Uncontrolled: Story = {
  name: 'Uncontrolled (keeps its own open state)',
  render: () => <ModuleSwitcher modules={hosModules} current="workforce" />,
};
