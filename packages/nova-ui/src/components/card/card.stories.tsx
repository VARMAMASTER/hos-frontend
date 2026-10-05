import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { Chip } from '../chip/chip';
import { Card, CardBody, CardHeader } from './card';

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
      <CardBody className="flex flex-wrap gap-2">
        <Chip tone="warn">2 queries</Chip>
        <Chip tone="good">5 filed</Chip>
      </CardBody>
    </Card>
  ),
};
