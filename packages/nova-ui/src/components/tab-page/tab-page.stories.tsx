import type { Meta, StoryObj } from '@storybook/react-vite';
import { TabPage } from './tab-page';
import { TabHeader } from './tab-header';
import { TabToolbar } from './tab-toolbar';
import { TabContent } from './tab-content';
import { TabKPIStrip } from './tab-kpi-strip';
import { Button } from '../button/button';
import { SearchField } from '../search-field/search-field';
import { Chip } from '../chip/chip';
import { KpiTile } from '../kpi-tile/kpi-tile';
import { Card, CardBody } from '../card/card';
import { Text } from '../text/text';

const meta = {
  title: 'Layout/TabPage',
  component: TabPage,
} satisfies Meta<typeof TabPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullModuleTab: Story = {
  render: () => (
    <TabPage patientId="PT-90214">
      <TabHeader
        title="Live Queue"
        description="Real-time OPD triage, token tracking, and doctor room allocations."
        badge={<Chip tone="good">18 Active</Chip>}
        actions={<Button tone="accent">Register Walk-in</Button>}
      />
      <TabKPIStrip columns={4}>
        <KpiTile title="Waiting" value="12" tone="warn" />
        <KpiTile title="In Consultation" value="6" tone="good" />
        <KpiTile title="Avg Wait Time" value="14m" tone="accent" />
        <KpiTile title="Completed" value="84" />
      </TabKPIStrip>
      <TabToolbar
        search={<SearchField placeholder="Search by token or patient name…" />}
        actions={<Button variant="ghost">Export CSV</Button>}
      />
      <TabContent>
        <Card>
          <CardBody>
            <Text variant="body">Patient queue tables and interactive status actions mount here.</Text>
          </CardBody>
        </Card>
      </TabContent>
    </TabPage>
  ),
};

export const LoadingState: Story = {
  render: () => (
    <TabPage loading>
      <div>Content</div>
    </TabPage>
  ),
};

export const ErrorState: Story = {
  render: () => (
    <TabPage error="Connection to queue service timed out. Please check telemetry.">
      <TabHeader title="Live Queue" />
    </TabPage>
  ),
};
