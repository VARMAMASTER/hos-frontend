import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup, ButtonGroupItem } from './button-group';

const meta = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const SingleSelect: Story = {
  render: () => (
    <ButtonGroup aria-label="Bed view" defaultValue="list">
      <ButtonGroupItem value="list">List</ButtonGroupItem>
      <ButtonGroupItem value="grid">Grid</ButtonGroupItem>
      <ButtonGroupItem value="map">Floor map</ButtonGroupItem>
    </ButtonGroup>
  ),
};

export const Small: Story = {
  render: () => (
    <ButtonGroup aria-label="Range" size="sm" defaultValue="7d">
      <ButtonGroupItem value="24h">24 h</ButtonGroupItem>
      <ButtonGroupItem value="7d">7 days</ButtonGroupItem>
      <ButtonGroupItem value="30d">30 days</ButtonGroupItem>
    </ButtonGroup>
  ),
};

export const MultipleSelect: Story = {
  render: () => (
    <ButtonGroup
      type="multiple"
      aria-label="Shifts"
      defaultValue={['day', 'evening']}
    >
      <ButtonGroupItem value="day">Day</ButtonGroupItem>
      <ButtonGroupItem value="evening">Evening</ButtonGroupItem>
      <ButtonGroupItem value="night">Night</ButtonGroupItem>
    </ButtonGroup>
  ),
};

export const WithDisabledSegment: Story = {
  render: () => (
    <ButtonGroup aria-label="Export" defaultValue="pdf">
      <ButtonGroupItem value="pdf">PDF</ButtonGroupItem>
      <ButtonGroupItem value="csv" disabled>
        CSV
      </ButtonGroupItem>
      <ButtonGroupItem value="print">Print</ButtonGroupItem>
    </ButtonGroup>
  ),
};

export const Controlled: Story = {
  render: function Render() {
    const [view, setView] = useState('grid');
    return (
      <div className="flex flex-col gap-s5">
        <ButtonGroup aria-label="Bed view" value={view} onValueChange={setView}>
          <ButtonGroupItem value="list">List</ButtonGroupItem>
          <ButtonGroupItem value="grid">Grid</ButtonGroupItem>
        </ButtonGroup>
        <p className="text-label text-ink-2" aria-live="polite">
          Showing the {view}.
        </p>
      </div>
    );
  },
};
