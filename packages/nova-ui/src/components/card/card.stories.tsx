import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { Chip } from '../chip/chip';
import { Card, CardBody, CardFooter, CardHeader } from './card';

const meta = { title: 'Components/Card', component: Card } satisfies Meta<
  typeof Card
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHeaderAndBody: Story = {
  render: () => (
    <Card className="max-w-xl">
      <CardHeader
        title="Claims in flight"
        description="Every scheme's own clock, in one place"
        actions={<Button size="sm">File claim</Button>}
      />
      <CardBody className="flex flex-wrap gap-s3">
        <Chip tone="warn">2 queries</Chip>
        <Chip tone="good">5 filed</Chip>
      </CardBody>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="max-w-xl">
      <CardHeader title="Ward 4B" description="Medicine, second floor" />
      <CardBody className="text-control text-ink-2">
        14 of 18 beds occupied; 2 discharges expected before noon.
      </CardBody>
      <CardFooter>
        <span>Updated 08:40</span>
        <Button size="sm" variant="ghost">
          Open ward
        </Button>
      </CardFooter>
    </Card>
  ),
};

// A choice between cards: the selected one gets a 2px primary edge and nothing else. The radios
// carry the semantics; the cards press to 0.98.
export const SelectableCards: Story = {
  render: function Render() {
    const plans = ['General ward', 'Semi-private', 'Private room'];
    const [chosen, setChosen] = useState(plans[1]);
    return (
      <fieldset className="grid max-w-3xl gap-s6 sm:grid-cols-3">
        <legend className="mb-s3 text-control font-semibold text-ink">
          Room type
        </legend>
        {plans.map((plan) => (
          <Card
            key={plan}
            interactive
            selected={plan === chosen}
            // The radio is visually hidden, so the card shows its keyboard focus.
            className="has-[input:focus-visible]:outline-focus has-[input:focus-visible]:outline-offset-focus has-[input:focus-visible]:outline-primary"
          >
            <label className="flex cursor-pointer flex-col gap-s3 p-s7">
              <span className="text-title font-semibold text-ink">{plan}</span>
              <span className="text-control text-ink-3">
                {plan === chosen ? 'Selected' : 'Available'}
              </span>
              <input
                type="radio"
                name="room"
                checked={plan === chosen}
                onChange={() => setChosen(plan)}
                className="sr-only"
              />
            </label>
          </Card>
        ))}
      </fieldset>
    );
  },
};
