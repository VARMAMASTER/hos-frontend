import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BedGrid, type Bed } from './bed-grid';

const beds: Bed[] = [
  {
    id: 'a1',
    label: 'A-01',
    status: 'occupied',
    patient: 'Ramesh',
    ward: 'Ward A',
  },
  { id: 'a2', label: 'A-02', status: 'free', ward: 'Ward A' },
  {
    id: 'a3',
    label: 'A-03',
    status: 'occupied',
    patient: 'Lakshmi',
    ward: 'Ward A',
  },
  { id: 'a4', label: 'A-04', status: 'cleaning', ward: 'Ward A' },
  {
    id: 'a5',
    label: 'A-05',
    status: 'occupied',
    patient: 'Srinivas',
    ward: 'Ward A',
  },
  { id: 'a6', label: 'A-06', status: 'free', ward: 'Ward A' },
  { id: 'a7', label: 'A-07', status: 'blocked', ward: 'Ward A' },
  {
    id: 'a8',
    label: 'A-08',
    status: 'occupied',
    patient: 'Padma',
    ward: 'Ward A',
  },
];

const meta = {
  title: 'Components/BedGrid',
  component: BedGrid,
  args: { beds, ariaLabel: 'Ward A beds' },
} satisfies Meta<typeof BedGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = {};

function Selectable() {
  const [selected, setSelected] = useState<string | null>(null);
  const bed = beds.find((b) => b.id === selected);
  return (
    <div className="space-y-3">
      <BedGrid beds={beds} ariaLabel="Ward A beds" onSelect={setSelected} />
      <p role="status" className="text-[13px] text-ink-2">
        {bed ? `Selected bed ${bed.label} (${bed.status})` : 'No bed selected'}
      </p>
    </div>
  );
}

export const SelectableCells: Story = {
  name: 'Selectable (cells are buttons)',
  render: () => <Selectable />,
};

export const StatusIsNeverColourAlone: Story = {
  name: 'Every status carries a word',
  args: {
    beds: [
      { id: 'f', label: '1', status: 'free' },
      { id: 'o', label: '2', status: 'occupied', patient: 'Ramesh' },
      { id: 'c', label: '3', status: 'cleaning' },
      { id: 'b', label: '4', status: 'blocked' },
    ],
  },
};
