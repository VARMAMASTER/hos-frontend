import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiBadge } from '../components/ai-badge/ai-badge';
import { Button } from '../components/button/button';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { Chip } from '../components/chip/chip';
import { HeroBand } from '../components/hero-band/hero-band';
import { KpiTile } from '../components/kpi-tile/kpi-tile';

const meta = { title: 'Materials/Glass and solid' } satisfies Meta;

export default meta;

// Flip Material in the toolbar to compare. Glass is the prototype's own: the hero, the glass panel,
// the top bar and the overlay frost; solid is the same layout with the prototype's opaque fallbacks.
// Cards, fields and data (the KPI tiles, the data card) are opaque in the prototype, so they look the
// same under both.
export const Surfaces: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      <HeroBand
        title="Today at the hospital"
        description="12 admissions, 9 discharges, 4 beds free"
        actions={<Button variant="outline">New admission</Button>}
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
        <Card variant="glass">
          <CardHeader
            title="Glass panel"
            description=".glass-panel on glass, the card on solid"
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
            description="Opaque under both materials, with the gradient edge"
            actions={<Chip tone="info">Dense data</Chip>}
          />
          <CardBody className="flex flex-wrap gap-2">
            <Chip tone="crit">1 rejected</Chip>
            <Chip>8 pending</Chip>
          </CardBody>
        </Card>
      </div>

      {/* The AI gradient rail on a plain card, and the brand gradient text. */}
      <div className="grid items-center gap-4 md:grid-cols-2">
        <Card className="nova-ai-rail">
          <CardHeader
            title="AI draft"
            description="The gradient rail and the spark mark an AI surface"
            actions={<AiBadge />}
          />
        </Card>
        <h2 className="nova-gradient-text w-fit text-[23px] font-semibold">
          Brand gradient text
        </h2>
      </div>

      {/* The remaining surface utilities, until components use them. */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="nova-chrome rounded-lg p-4">
          <p className="text-[13px] font-semibold">nova-chrome</p>
          <p className="text-[13px] text-(color:--nova-chrome-ink-2)">
            Secondary ink on the app frame
          </p>
        </div>
        <div className="nova-overlay rounded-lg p-4">
          <p className="text-[13px] font-semibold text-ink">nova-overlay</p>
          <p className="text-[13px] text-ink-3">Menus, dialogs and tooltips</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-[13px] text-ink-3">nova-field</span>
          <input
            className="nova-field w-full rounded-sm px-2.5 py-2 text-[13.5px] text-ink"
            placeholder="Search patients"
          />
        </label>
      </div>
    </div>
  ),
};
