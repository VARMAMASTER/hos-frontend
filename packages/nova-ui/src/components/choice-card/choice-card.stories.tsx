import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from '../chip/chip';
import { ChoiceCard, ChoiceCardGroup } from './choice-card';

const meta = {
  title: 'Components/ChoiceCard',
  component: ChoiceCard,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const AdmissionType: Story = {
  render: () => (
    <ChoiceCardGroup
      legend="Admission type"
      name="admission"
      columns={3}
      defaultValue="planned"
    >
      <ChoiceCard
        value="emergency"
        title="Emergency"
        description="Unplanned. Needs a bed now."
        badge={<Chip tone="crit">Urgent</Chip>}
      />
      <ChoiceCard
        value="planned"
        title="Planned"
        description="Booked ahead with a consultant."
      />
      <ChoiceCard
        value="daycare"
        title="Day care"
        description="Home the same evening."
        disabled
      />
    </ChoiceCardGroup>
  ),
};

export const Multiple: Story = {
  render: () => (
    <ChoiceCardGroup
      type="multiple"
      legend="Care needs"
      name="needs"
      columns={2}
      defaultValue={['oxygen']}
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
      />
    </ChoiceCardGroup>
  ),
};

export const Single: Story = {
  args: {
    name: 'single',
    title: 'Planned',
    description: 'Booked ahead with a consultant.',
  },
};
