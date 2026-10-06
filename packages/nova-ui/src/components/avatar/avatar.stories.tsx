import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './avatar';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  args: { name: 'Asha Rao' },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// An inline SVG stands in for a photo, so the story needs no network.
const portrait = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#0E7490"/><circle cx="20" cy="15" r="7" fill="#DDF4FA"/><path d="M6 40c0-9 6-14 14-14s14 5 14 14" fill="#DDF4FA"/></svg>',
)}`;

export const Initials: Story = {};

export const SingleName: Story = { args: { name: 'Ramesh' } };

export const Small: Story = { args: { size: 'sm' } };

export const WithImage: Story = { args: { src: portrait } };

// A photo that cannot load falls back to the initials rather than a broken-image icon.
export const BrokenImage: Story = {
  args: { src: 'https://invalid.invalid/missing.png' },
};

export const Verified: Story = { args: { verified: true, size: 'lg' } };

// 20 (inline), 32, 40 and 48 (a list card).
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Avatar {...args} size="xs" />
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
      <Avatar {...args} size="lg" src={portrait} verified />
    </div>
  ),
};
