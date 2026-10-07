import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiBadge } from '../components/ai-badge/ai-badge';
import { Button } from '../components/button/button';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { Chip } from '../components/chip/chip';
import { HeroBand } from '../components/hero-band/hero-band';
import { KpiTile } from '../components/kpi-tile/kpi-tile';

const meta = { title: 'Materials/Glass, frost and solid' } satisfies Meta;

export default meta;

// Flip Material in the toolbar to compare, and Scheme for each in the dark. Glass is the prototype's
// own: the hero, the glass panel, the top bar and the overlay frost. Frost is a heavier, more opaque
// glass, tinted toward panel-2. Solid is the same layout with the prototype's opaque fallbacks. Cards,
// fields and data (the KPI tiles, the data card) are opaque in the prototype, so they look the same
// under all three.
export const Surfaces: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-s8">
      <HeroBand
        title="Today at the hospital"
        description="12 admissions, 9 discharges, 4 beds free"
        actions={
          <>
            <Button variant="ghost">New appointment</Button>
            <Button>Register patient</Button>
          </>
        }
      />

      <div className="grid gap-s6 md:grid-cols-3">
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

      <div className="grid gap-s6 md:grid-cols-2">
        <Card variant="glass">
          <CardHeader
            title="Glass panel"
            description=".glass-panel on glass, heavier on frost, the card on solid"
            actions={<Chip tone="ai">AI draft</Chip>}
          />
          <CardBody className="flex flex-wrap gap-s3">
            <Chip tone="warn">2 queries</Chip>
            <Chip tone="good">5 filed</Chip>
          </CardBody>
        </Card>
        <Card variant="data">
          <CardHeader
            title="Data card"
            description="Opaque under every material, with the gradient edge"
            actions={<Chip tone="info">Dense data</Chip>}
          />
          <CardBody className="flex flex-wrap gap-s3">
            <Chip tone="crit">1 rejected</Chip>
            <Chip>8 pending</Chip>
          </CardBody>
        </Card>
      </div>

      {/* The AI gradient rail on a plain card, and the brand gradient text. */}
      <div className="grid items-center gap-s6 md:grid-cols-2">
        <Card className="nova-ai-rail">
          <CardHeader
            title="AI draft"
            description="The gradient rail and the spark mark an AI surface"
            actions={<AiBadge />}
          />
        </Card>
        <h2 className="nova-gradient-text w-fit text-display font-semibold">
          Brand gradient text
        </h2>
      </div>

      {/* The remaining surface utilities, until components use them. */}
      <div className="grid gap-s6 md:grid-cols-3">
        <div className="nova-chrome rounded-overlay p-s6">
          <p className="text-control font-semibold">nova-chrome</p>
          <p className="text-control text-(color:--nova-chrome-ink-2)">
            Secondary ink on the app frame
          </p>
        </div>
        <div className="nova-overlay rounded-overlay p-s6">
          <p className="text-control font-semibold text-ink">nova-overlay</p>
          <p className="text-control text-ink-3">Menus, dialogs and tooltips</p>
        </div>
        <label className="block">
          <span className="mb-s1 block text-control text-ink-3">
            nova-field
          </span>
          <input
            className="nova-field w-full rounded-control px-s4 py-s3 text-input text-ink"
            placeholder="Search patients"
          />
        </label>
      </div>
    </div>
  ),
};
