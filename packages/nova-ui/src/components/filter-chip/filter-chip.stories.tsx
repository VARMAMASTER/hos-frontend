import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterChip } from './filter-chip';

const meta = {
  title: 'Components/FilterChip',
  component: FilterChip,
  args: { children: 'ICU' },
} satisfies Meta<typeof FilterChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { defaultPressed: true } };
export const Disabled: Story = { args: { disabled: true } };

// A row of filters over a ward list: each chip is its own toggle, and the summary is announced.
export const WardFilters: Story = {
  render: function Render() {
    const wards = ['ICU', 'Medicine', 'Surgery', 'Paediatrics', 'Maternity'];
    const [active, setActive] = useState<string[]>(['ICU']);
    return (
      <div className="flex flex-col gap-3">
        <div role="group" aria-label="Wards" className="flex flex-wrap gap-2">
          {wards.map((ward) => (
            <FilterChip
              key={ward}
              pressed={active.includes(ward)}
              onPressedChange={(on) =>
                setActive((current) =>
                  on
                    ? [...current, ward]
                    : current.filter((name) => name !== ward),
                )
              }
            >
              {ward}
            </FilterChip>
          ))}
        </div>
        <p className="text-[12px] text-ink-2" aria-live="polite">
          {active.length === 0
            ? 'Showing every ward'
            : `Showing ${active.join(', ')}`}
        </p>
      </div>
    );
  },
};
