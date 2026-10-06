import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { IconTile } from './icon-tile';

const decorate: Decorator = (Story) => (
  <div className="nova-chrome w-64 rounded-lg p-4">
    <Story />
  </div>
);

const meta = {
  title: 'Components/IconTile',
  component: IconTile,
  args: { children: 'Ph' },
  // The chrome tone is made for the dark sidebar, so show it on one.
  decorators: [decorate],
} satisfies Meta<typeof IconTile>;

export default meta;
type Story = StoryObj<typeof meta>;

const glyph = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 19V8" />
    <path d="M3 12h13a5 5 0 0 1 5 5v2" />
    <path d="M3 19h18" />
    <circle cx="8" cy="8.5" r="2.2" />
  </svg>
);

export const Monogram: Story = {};

export const Glyph: Story = { args: { children: glyph } };

export const Ai: Story = { args: { tone: 'ai', children: '✦' } };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconTile size="sm">Ph</IconTile>
      <IconTile size="md">Ph</IconTile>
      <IconTile size="sm">{glyph}</IconTile>
      <IconTile size="md">{glyph}</IconTile>
    </div>
  ),
};

export const BesideALabel: Story = {
  name: 'Beside a label (decorative, hidden from screen readers)',
  render: () => (
    <div className="flex items-center gap-3 text-sm font-semibold text-on-primary">
      <IconTile>{glyph}</IconTile>
      <span>Beds</span>
    </div>
  ),
};

export const Standalone: Story = {
  name: 'Standalone (exposed, named by its label)',
  args: { label: 'Pharmacy', children: 'Ph' },
};
