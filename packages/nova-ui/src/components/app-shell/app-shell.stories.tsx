import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavItem } from '../sidebar/nav-item';
import { Sidebar } from '../sidebar/sidebar';
import { AppShell } from './app-shell';

const meta = {
  title: 'Components/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sidebar: (
      <Sidebar
        brand={<span className="text-[14px] font-semibold">Acme Hospital</span>}
      >
        <NavItem href="#dashboard" active>
          Dashboard
        </NavItem>
        <NavItem href="#patients">Patients</NavItem>
        <NavItem href="#claims">Claims</NavItem>
      </Sidebar>
    ),
    children: (
      <div className="p-6">
        <h1 className="text-[17px] font-semibold text-ink">Dashboard</h1>
        <p className="mt-2 text-ink-2">
          The content column sits on the brand canvas and can shrink, so a wide
          table scrolls inside it instead of stretching the page. See the full
          page under Pages / App shell.
        </p>
      </div>
    ),
  },
};
