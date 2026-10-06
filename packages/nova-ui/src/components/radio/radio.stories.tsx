import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from './radio';

const meta = {
  title: 'Components/Radio',
  component: Radio,
  args: { name: 'sex', label: 'Female', value: 'f' },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};
export const Selected: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };

// A group is a <fieldset> with a <legend>, so assistive technology announces its name.
export const Group: Story = {
  render: () => (
    <fieldset>
      <legend className="text-callout font-semibold text-ink">
        Triage category
      </legend>
      <div className="mt-2 flex flex-col gap-3">
        <Radio name="triage" value="red" label="Immediate" />
        <Radio name="triage" value="amber" label="Urgent" defaultChecked />
        <Radio name="triage" value="green" label="Non-urgent" />
        <Radio name="triage" value="black" label="Expectant" disabled />
      </div>
    </fieldset>
  ),
};
