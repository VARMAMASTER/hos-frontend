import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/button/button';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { Chip } from '../components/chip/chip';
import { HeroBand } from '../components/hero-band/hero-band';
import { KpiTile } from '../components/kpi-tile/kpi-tile';

const meta = { title: 'Materials/Glass and solid' } satisfies Meta;

export default meta;

// Flip Material in the toolbar to compare. Glass frosts the canvas behind the hero, the panel and
// the overlay; solid is the same layout with flat fills. The data surfaces (the data card and the
// KPI tiles) are opaque by design, so they must look the same under both.
export const Surfaces: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      <HeroBand
        title="Today at the hospital"
        description="12 admissions, 9 discharges, 4 beds free"
        actions={<Button variant="secondary">New admission</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiTile
          label="Collections today"
          value="₹4.2L"
          delta="12% vs last week"
          trend="up"
          tone="good"
        />
        <KpiTile
          label="Claim rejections"
          value="9"
          delta="3 more than yesterday"
          trend="up"
          tone="crit"
        />
        <KpiTile label="Beds free" value="14" delta="No change" trend="flat" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader
            title="Panel"
            description="Frosts the canvas on glass, a flat card on solid"
            actions={<Chip tone="ai">AI draft</Chip>}
          />
          <CardBody className="flex flex-wrap gap-2">
            <Chip tone="warn">2 queries</Chip>
            <Chip tone="good">5 filed</Chip>
          </CardBody>
        </Card>
        <Card variant="data">
          <CardHeader
            title="Data card"
            description="Opaque under both materials, with the richness in the rim"
            actions={<Chip tone="info">Dense data</Chip>}
          />
          <CardBody className="flex flex-wrap gap-2">
            <Chip tone="crit">1 rejected</Chip>
            <Chip>8 pending</Chip>
          </CardBody>
        </Card>
      </div>

      {/* The AI rail and the brand gradient text, until components use them. */}
      <div className="grid items-center gap-4 md:grid-cols-2">
        <Card className="nova-ai-rail">
          <CardHeader
            title="AI draft"
            description="The rail marks an AI surface in the fixed AI gradient"
            actions={<Chip tone="ai">AI</Chip>}
          />
        </Card>
        <h2 className="nova-gradient-text w-fit text-3xl font-semibold">
          Brand gradient text
        </h2>
      </div>

      {/* The remaining surface utilities, until components use them. */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="nova-chrome rounded-lg p-4">
          <p className="text-sm font-semibold">nova-chrome</p>
          <p className="text-sm text-(color:--nova-chrome-ink-2)">
            Secondary ink on the app frame
          </p>
        </div>
        <div className="nova-overlay rounded-lg p-4">
          <p className="text-sm font-semibold text-ink">nova-overlay</p>
          <p className="text-sm text-ink-3">Menus, dialogs and tooltips</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm text-ink-3">nova-field</span>
          <input
            className="nova-field h-10 w-full rounded-md px-3 text-sm text-ink"
            placeholder="Search patients"
          />
        </label>
      </div>
    </div>
  ),
};
