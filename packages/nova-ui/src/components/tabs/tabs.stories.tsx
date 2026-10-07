import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tab, TabList, TabPanel, Tabs } from './tabs';

// Tabs is controlled, so the stories own the selection the way a page would.
const meta = { title: 'Components/Tabs' } satisfies Meta;

export default meta;
type Story = StoryObj;

function AdmissionTabs({ withDisabled = false }: { withDisabled?: boolean }) {
  const [value, setValue] = useState('overview');
  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabList aria-label="Admission">
        <Tab value="overview">Overview</Tab>
        <Tab value="claims">Claims</Tab>
        <Tab value="notes" disabled={withDisabled}>
          Notes
        </Tab>
        <Tab value="history">History</Tab>
      </TabList>
      <TabPanel value="overview" className="mt-s6 text-ink-2">
        Overview panel. Left and Right move between the tabs, Home and End jump
        to the first and last.
      </TabPanel>
      <TabPanel value="claims" className="mt-s6 text-ink-2">
        Claims panel.
      </TabPanel>
      <TabPanel value="notes" className="mt-s6 text-ink-2">
        Notes panel.
      </TabPanel>
      <TabPanel value="history" className="mt-s6 text-ink-2">
        History panel.
      </TabPanel>
    </Tabs>
  );
}

export const Default: Story = { render: () => <AdmissionTabs /> };

export const WithDisabledTab: Story = {
  render: () => <AdmissionTabs withDisabled />,
};
