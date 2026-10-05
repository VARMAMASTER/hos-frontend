import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from '../components/chip/chip';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { BarChart } from '../components/chart/bar-chart';
import { DonutChart } from '../components/chart/donut-chart';
import { LineChart } from '../components/chart/line-chart';
import { Sparkline } from '../components/chart/sparkline';
import { HeroBand } from '../components/hero-band/hero-band';
import { KpiTile, type KpiTileProps } from '../components/kpi-tile/kpi-tile';

const meta = {
  title: 'Charts/Hospital dashboard',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const kpis: Array<{
  tile: KpiTileProps;
  key: string;
  values: number[];
  label: string;
}> = [
  {
    tile: {
      label: 'Collections today',
      value: '₹4.2L',
      delta: '12% vs last week',
      trend: 'up',
      tone: 'good',
    },
    key: 'collections',
    values: [3.1, 3.6, 3.4, 3.9, 4.0, 3.7, 4.2],
    label: 'Collections, lakhs of rupees',
  },
  {
    tile: {
      label: 'Beds free',
      value: 44,
      delta: '6 fewer than yesterday',
      trend: 'down',
      tone: 'warn',
    },
    key: 'free',
    values: [58, 55, 52, 50, 49, 47, 44],
    label: 'Free beds',
  },
  {
    tile: {
      label: 'Claim rejections',
      value: 9,
      delta: '3 more than yesterday',
      trend: 'up',
      tone: 'crit',
    },
    key: 'rejections',
    values: [4, 6, 5, 7, 6, 6, 9],
    label: 'Claim rejections',
  },
  {
    tile: {
      label: 'Avg. stay',
      value: '3.4 d',
      delta: 'No change',
      trend: 'flat',
    },
    key: 'stay',
    values: [3.5, 3.3, 3.4, 3.5, 3.4, 3.3, 3.4],
    label: 'Average length of stay, days',
  },
];

const wards = [
  { ward: 'ICU', occupied: 18, free: 2 },
  { ward: 'General', occupied: 54, free: 16 },
  { ward: 'Maternity', occupied: 21, free: 9 },
  { ward: 'Paediatrics', occupied: 17, free: 13 },
  { ward: 'Orthopaedics', occupied: 26, free: 4 },
];

const movement = [
  { day: 'Mon', admissions: 42, discharges: 38 },
  { day: 'Tue', admissions: 51, discharges: 40 },
  { day: 'Wed', admissions: 47, discharges: 55 },
  { day: 'Thu', admissions: 58, discharges: 49 },
  { day: 'Fri', admissions: 53, discharges: 57 },
  { day: 'Sat', admissions: 36, discharges: 44 },
  { day: 'Sun', admissions: 31, discharges: 35 },
];

const payers = [
  { payer: 'Insurance', patients: 120 },
  { payer: 'Government scheme', patients: 80 },
  { payer: 'Corporate', patients: 46 },
  { payer: 'Self pay', patients: 40 },
];

// Flip Glass/Solid and the hospital theme in the toolbar. The panels are glass or solid with the
// product material; every chart sits on an opaque data surface (and the cards that hold them are data
// cards), so the plots read the same under both. The series colours do not change with the hospital.
export const Dashboard: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      <HeroBand
        title="Hospital overview"
        description="Week to date, all wards"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ tile, key, values, label }) => (
          <KpiTile
            key={key}
            {...tile}
            visual={
              <Sparkline
                ariaLabel={`${label}, last 7 days`}
                data={days.map((day, index) => ({ day, [key]: values[index] }))}
                config={{ [key]: { label, color: 'chart-1' } }}
                categoryKey="day"
                seriesKeys={[key]}
                height={40}
              />
            }
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="data">
          <CardHeader
            title="Bed occupancy"
            description="By ward, today"
            actions={<Chip tone="info">Live</Chip>}
          />
          <CardBody>
            <BarChart
              bare
              ariaLabel="Bed occupancy by ward"
              description="Occupied and free beds in each ward. General has the most occupied beds."
              data={wards}
              config={{
                occupied: { label: 'Occupied', color: 'chart-1' },
                free: { label: 'Free', color: 'chart-2' },
              }}
              categoryKey="ward"
              seriesKeys={['occupied', 'free']}
              stacked
            />
          </CardBody>
        </Card>

        <Card variant="data">
          <CardHeader
            title="Admissions"
            description="Admissions and discharges this week"
          />
          <CardBody>
            <LineChart
              bare
              ariaLabel="Admissions and discharges this week"
              description="Admissions peak on Thursday; discharges peak on Friday."
              data={movement}
              config={{
                admissions: { label: 'Admissions', color: 'chart-1' },
                discharges: { label: 'Discharges', color: 'chart-3' },
              }}
              categoryKey="day"
              seriesKeys={['admissions', 'discharges']}
            />
          </CardBody>
        </Card>
      </div>

      <Card variant="data" className="max-w-xl">
        <CardHeader
          title="Payer mix"
          description="Share of patients by payer"
        />
        <CardBody>
          <DonutChart
            bare
            ariaLabel="Payer mix"
            description="Insurance is the largest payer, then government schemes."
            data={payers}
            config={{
              Insurance: { label: 'Insurance', color: 'chart-1' },
              'Government scheme': {
                label: 'Government scheme',
                color: 'chart-2',
              },
              Corporate: { label: 'Corporate', color: 'chart-3' },
              'Self pay': { label: 'Self pay', color: 'chart-4' },
            }}
            categoryKey="payer"
            valueKey="patients"
            totalLabel="Patients"
          />
        </CardBody>
      </Card>
    </div>
  ),
};
