import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { HeroBand } from './hero-band';

const meta = {
  title: 'Components/HeroBand',
  component: HeroBand,
} satisfies Meta<typeof HeroBand>;

export default meta;
type Story = StoryObj<typeof meta>;

// The page-top band: a title, its context, and the page's main actions.
export const Default: Story = {
  args: {
    title: 'Hospital overview',
    description: 'Week to date, all wards',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Ward 4B',
    description: 'Medicine, second floor · 14 of 18 beds occupied',
    actions: (
      <>
        <Button variant="secondary">Print board</Button>
        <Button>Admit patient</Button>
      </>
    ),
  },
};

// A section of a page, not the page itself: the title is an h2.
export const AsASection: Story = {
  args: {
    title: 'Discharges today',
    description: '6 planned, 2 waiting on pharmacy',
    headingLevel: 2,
  },
};
