import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { BrandMark } from './brand-mark';

const decorate: Decorator = (Story) => (
  <div className="nova-chrome w-64 rounded-lg p-4">
    <Story />
  </div>
);

const meta = {
  title: 'Components/BrandMark',
  component: BrandMark,
  args: { name: 'HOS', sub: 'Hospital OS' },
  decorators: [decorate],
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

export const HospitalName: Story = {
  args: { name: 'Sri Venkateshwara Hospital', sub: 'Kukatpally, Hyderabad' },
};

export const AsLink: Story = {
  name: 'As a link (name is the accessible name)',
  args: { href: '#home' },
};

export const WithLogo: Story = {
  args: {
    logo: (
      <svg viewBox="0 0 36 36" role="presentation">
        <rect width="36" height="36" rx="11" className="fill-primary" />
        <path
          d="M18 9v18M9 18h18"
          className="stroke-on-primary"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
};
