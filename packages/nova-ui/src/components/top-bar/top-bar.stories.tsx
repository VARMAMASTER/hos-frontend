import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { Chip } from '../chip/chip';
import { SearchField } from '../search-field/search-field';
import { TopBar } from './top-bar';

const meta = {
  title: 'Components/TopBar',
  component: TopBar,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const search = (
  <SearchField
    label="Search patients"
    placeholder="Search patients, claims and orders"
    shortcutHint="Ctrl K"
  />
);

export const Default: Story = {
  args: {
    search,
    actions: (
      <>
        <Chip tone="ai">3 AI drafts</Chip>
        <Button variant="outline" size="sm">
          New admission
        </Button>
      </>
    ),
  },
};

export const SearchOnly: Story = {
  args: { search },
};

export const WithMiddleContent: Story = {
  args: {
    search,
    children: <p className="text-callout font-semibold">Ward 4B</p>,
    actions: (
      <Button variant="outline" size="sm">
        Handover
      </Button>
    ),
  },
};
