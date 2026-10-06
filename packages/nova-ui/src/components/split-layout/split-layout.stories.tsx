import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardBody, CardHeader } from '../card/card';
import { SplitLayout } from './split-layout';

const meta = {
  title: 'Components/SplitLayout',
  component: SplitLayout,
  args: {
    ratio: '2-1',
    primary: (
      <Card>
        <CardHeader title="Primary" description="The wider region" />
        <CardBody className="text-[13px] text-ink-2">
          Collapses to one column below the md breakpoint.
        </CardBody>
      </Card>
    ),
    secondary: (
      <Card>
        <CardHeader title="Secondary" description="The narrower region" />
        <CardBody className="text-[13px] text-ink-2">Side content.</CardBody>
      </Card>
    ),
  },
} satisfies Meta<typeof SplitLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoToOne: Story = {};
export const Even: Story = { args: { ratio: '1-1' } };
export const ThreeToTwo: Story = { args: { ratio: '3-2' } };
export const SecondaryFirst: Story = { args: { secondaryFirst: true } };

export const WideTableCannotPushThePageWider: Story = {
  args: {
    primary: (
      <Card>
        <CardHeader title="A very wide table" />
        <CardBody className="overflow-x-auto">
          <table className="w-[60rem] text-left text-[13px] text-ink">
            <tbody>
              <tr>
                <td className="p-2">The region scrolls, the page does not.</td>
              </tr>
            </tbody>
          </table>
        </CardBody>
      </Card>
    ),
  },
};
