import { useState, type ReactNode } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { SectionNav, type SectionNavItem } from './section-nav';

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

const queue = (
  <Glyph>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1.3" />
    <circle cx="4" cy="12" r="1.3" />
    <circle cx="4" cy="18" r="1.3" />
  </Glyph>
);
const bed = (
  <Glyph>
    <path d="M3 19V8" />
    <path d="M3 12h13a5 5 0 0 1 5 5v2" />
    <path d="M3 19h18" />
    <circle cx="8" cy="8.5" r="2.2" />
  </Glyph>
);
const pulse = (
  <Glyph>
    <path d="M3 12h4l2.5-7 4 14 2.5-7h5" />
  </Glyph>
);
const doc = (
  <Glyph>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </Glyph>
);

const sections: SectionNavItem[] = [
  { id: 'queue', label: 'My queue', icon: queue },
  { id: 'beds', label: 'Bed board', icon: bed },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: doc,
    badge: 12,
    badgeLabel: 'pending',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: pulse,
    badge: 3,
    badgeLabel: 'unread',
  },
  { id: 'reports', label: 'Reports', icon: doc, disabled: true },
];

const decorate: Decorator = (Story) => (
  <div className="nova-chrome w-sidebar rounded-overlay p-s5">
    <Story />
  </div>
);

const meta = {
  title: 'Components/SectionNav',
  component: SectionNav,
  args: { ariaLabel: 'Ward sections', items: sections },
  // Built for the dark sidebar, so show it on one.
  decorators: [decorate],
} satisfies Meta<typeof SectionNav>;

export default meta;
type Story = StoryObj<typeof meta>;

function Interactive() {
  const [active, setActive] = useState('beds');
  return (
    <SectionNav
      ariaLabel="Ward sections"
      onSelect={setActive}
      items={sections.map((item) => ({ ...item, active: item.id === active }))}
    />
  );
}

export const Selectable: Story = {
  name: 'Selectable (active gets aria-current="page")',
  render: () => <Interactive />,
};

export const BadgesSayWhatTheyCount: Story = {
  name: 'Badges read as "12 pending", not a bare 12',
  args: {
    items: sections.map((item) => ({
      ...item,
      active: item.id === 'approvals',
    })),
  },
};

export const AsLinks: Story = {
  args: {
    items: [
      { id: 'a', label: 'Overview', href: '#overview', active: true },
      { id: 'b', label: 'Billing', href: '#billing' },
      { id: 'c', label: 'Audit log', href: '#audit', disabled: true },
    ],
  },
};
