import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../avatar/avatar';
import { Chip } from './chip';

const meta = { title: 'Components/Chip', component: Chip } satisfies Meta<
  typeof Chip
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Chip>Pending</Chip>
      <Chip tone="good">Filed</Chip>
      <Chip tone="warn">Query raised</Chip>
      <Chip tone="crit">Denied</Chip>
      <Chip tone="info">Pre-auth</Chip>
      <Chip tone="ai">AI draft</Chip>
    </div>
  ),
};

export const WithIconAndAvatar: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Chip
        tone="good"
        icon={
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4.5 10.5l3.5 3.5 7.5-8" />
          </svg>
        }
      >
        Cleared
      </Chip>
      <Chip avatar={<Avatar name="Anita Rao" size="xs" />}>Dr Rao</Chip>
    </div>
  ),
};

export const Selected: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Chip selected>Medicine</Chip>
      <Chip tone="info" selected>
        Cardiology
      </Chip>
    </div>
  ),
};

// An input chip: a value the user has entered. Remove it with the cross, or Backspace / Delete while
// it is focused.
export const Removable: Story = {
  render: function Render() {
    const [tags, setTags] = useState(['Cardiology', 'Nephrology']);
    return (
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Chip
            key={tag}
            tone="info"
            onRemove={() => setTags((all) => all.filter((t) => t !== tag))}
          >
            {tag}
          </Chip>
        ))}
      </div>
    );
  },
};
