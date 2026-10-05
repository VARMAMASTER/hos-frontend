import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs } from './breadcrumbs';

const meta = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  args: {
    items: [
      { label: 'Patients', href: '#patients' },
      { label: 'Asha Rao', href: '#asha-rao' },
      { label: 'Lab results' },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

// The last item is the page being viewed: not a link, and marked aria-current="page".
export const Trail: Story = {};

export const TwoLevels: Story = {
  args: {
    items: [{ label: 'Patients', href: '#patients' }, { label: 'Asha Rao' }],
  },
};

export const SingleItem: Story = { args: { items: [{ label: 'Patients' }] } };

// An earlier item without an href is shown as plain text rather than a dead link.
export const WithUnlinkedStep: Story = {
  args: {
    items: [
      { label: 'Patients', href: '#patients' },
      { label: 'Ward 4B' },
      { label: 'Asha Rao' },
    ],
  },
};
