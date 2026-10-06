import type { Meta, StoryObj } from '@storybook/react-vite';
import { ComparisonBarChart } from './comparison-bar-chart';
import { DepartmentHeatmap } from './department-heatmap';
import { FunnelChart } from './funnel-chart';
import { OccupancyAreaChart } from './occupancy-area-chart';
import { PatientFlowChart } from './patient-flow-chart';
import { RadialGauge } from './radial-gauge';
import { VitalsChart, type VitalsConfig } from './vitals-chart';
import { WaitTimeChart } from './wait-time-chart';

// The charts a hospital product needs, on realistic sample data. Every story follows the toolbar's
// theme, material and scheme; each also has a Dark twin pinned to the dark scheme.
const meta = {
  title: 'Charts/Hospital',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const dark = { globals: { scheme: 'dark' } } as const;

// --- 24 hours of vitals, 06:00 to 05:00, with a febrile episode overnight -----------------------

const HOURS = Array.from(
  { length: 24 },
  (_, i) => `${String((6 + i) % 24).padStart(2, '0')}:00`,
);
const hr = [
  78, 80, 82, 79, 84, 88, 86, 83, 81, 85, 87, 90, 92, 95, 98, 104, 108, 112,
  116, 110, 102, 96, 90, 86,
];
const spo2 = [
  97, 97, 96, 97, 96, 96, 97, 96, 95, 96, 96, 95, 95, 94, 94, 93, 92, 91, 92,
  93, 94, 95, 96, 96,
];
const systolic = [
  124, 126, 128, 122, 130, 134, 132, 128, 126, 130, 136, 138, 140, 142, 144,
  146, 148, 150, 146, 142, 138, 134, 130, 128,
];
const diastolic = [
  80, 82, 82, 78, 84, 86, 84, 82, 80, 84, 86, 88, 88, 90, 92, 92, 94, 96, 94,
  90, 88, 86, 84, 82,
];
const temperature = [
  36.8, 36.8, 36.9, 36.9, 37.0, 37.1, 37.0, 37.0, 37.1, 37.2, 37.4, 37.6, 37.8,
  38.0, 38.2, 38.4, 38.6, 38.5, 38.3, 38.0, 37.7, 37.4, 37.2, 37.1,
];
const vitals = HOURS.map((time, i) => ({
  time,
  // 17:00: the reading was not taken (the patient was in radiology).
  hr: i === 11 ? null : hr[i],
  spo2: i === 11 ? null : spo2[i],
  sys: i === 11 ? null : systolic[i],
  dia: i === 11 ? null : diastolic[i],
  temp: i === 11 ? null : temperature[i],
}));

const vitalsConfig = {
  hr: {
    label: 'Heart rate',
    unit: 'bpm',
    color: 'chart-3',
    normal: { min: 60, max: 100 },
    thresholds: [{ value: 130, label: 'Tachycardia', level: 'crit' }],
  },
  spo2: {
    label: 'SpO₂',
    unit: '%',
    color: 'chart-1',
    normal: { min: 95, max: 100 },
    thresholds: [
      { value: 94, label: 'Escalate', level: 'warn' },
      { value: 92, label: 'Hypoxia', level: 'crit' },
    ],
    domain: [88, 100],
  },
  sys: {
    label: 'Systolic',
    unit: 'mmHg',
    color: 'chart-5',
    normal: { min: 90, max: 140 },
  },
  dia: {
    label: 'Diastolic',
    unit: 'mmHg',
    color: 'chart-6',
    normal: { min: 60, max: 90 },
  },
  temp: {
    label: 'Temperature',
    unit: '°C',
    color: 'chart-2',
    normal: { min: 36.1, max: 37.5 },
    thresholds: [{ value: 38.3, label: 'Fever', level: 'warn' }],
  },
} satisfies VitalsConfig;

function Vitals() {
  return (
    <VitalsChart
      className="max-w-3xl"
      ariaLabel="Bed ICU-4: vitals, last 24 hours"
      description="A febrile episode overnight: temperature peaked at 38.6 °C at 22:00 with heart rate to 116 and SpO₂ down to 91 % at 23:00; settling by 05:00."
      data={vitals}
      config={vitalsConfig}
      categoryKey="time"
      seriesKeys={['hr', 'spo2', 'sys', 'dia', 'temp']}
      panels={[
        {
          key: 'hr',
          label: 'Heart rate',
          unit: 'bpm',
          seriesKeys: ['hr'],
        },
        { key: 'spo2', label: 'SpO₂', unit: '%', seriesKeys: ['spo2'] },
        {
          key: 'bp',
          label: 'Blood pressure',
          unit: 'mmHg',
          seriesKeys: ['sys', 'dia'],
        },
        {
          key: 'temp',
          label: 'Temperature',
          unit: '°C',
          seriesKeys: ['temp'],
        },
      ]}
      now="05:00"
    />
  );
}

export const VitalsLast24Hours: Story = { render: () => <Vitals /> };
export const VitalsLast24HoursDark: Story = {
  ...dark,
  render: () => <Vitals />,
};

// --- A week of bed occupancy, four wards against 60 staffed beds ---------------------------------

const occupancy = [
  { day: 'Mon', icu: 9, medical: 22, surgical: 15, paeds: 6 },
  { day: 'Tue', icu: 10, medical: 23, surgical: 16, paeds: 7 },
  { day: 'Wed', icu: 11, medical: 24, surgical: 17, paeds: 6 },
  { day: 'Thu', icu: 12, medical: 26, surgical: 18, paeds: 7 },
  { day: 'Fri', icu: 12, medical: 25, surgical: 17, paeds: 8 },
  { day: 'Sat', icu: 11, medical: 23, surgical: 14, paeds: 7 },
  { day: 'Sun', icu: 10, medical: 21, surgical: 12, paeds: 6 },
];

function Occupancy() {
  return (
    <OccupancyAreaChart
      className="max-w-3xl"
      ariaLabel="IPD bed occupancy by ward, this week"
      data={occupancy}
      config={{
        icu: { label: 'ICU', color: 'chart-1' },
        medical: { label: 'Medical', color: 'chart-2' },
        surgical: { label: 'Surgical', color: 'chart-3' },
        paeds: { label: 'Paediatrics', color: 'chart-5' },
      }}
      categoryKey="day"
      seriesKeys={['icu', 'medical', 'surgical', 'paeds']}
      capacity={60}
    />
  );
}

export const OccupancyThisWeek: Story = { render: () => <Occupancy /> };
export const OccupancyThisWeekDark: Story = {
  ...dark,
  render: () => <Occupancy />,
};

// --- Patient flow: admissions, discharges and census per day -------------------------------------

const flow = [
  { day: 'Mon', admitted: 14, discharged: 9, census: 47 },
  { day: 'Tue', admitted: 12, discharged: 10, census: 49 },
  { day: 'Wed', admitted: 15, discharged: 12, census: 52 },
  { day: 'Thu', admitted: 16, discharged: 13, census: 55 },
  { day: 'Fri', admitted: 11, discharged: 15, census: 51 },
  { day: 'Sat', admitted: 8, discharged: 14, census: 45 },
  { day: 'Sun', admitted: 7, discharged: 6, census: 46 },
];

function Flow() {
  return (
    <PatientFlowChart
      className="max-w-3xl"
      ariaLabel="Patient flow, this week"
      description="Admissions outpaced discharges until Thursday; Friday and Saturday discharges brought the census back to 45."
      data={flow}
      config={{
        admitted: { label: 'Admissions', color: 'chart-1' },
        discharged: { label: 'Discharges', color: 'chart-2' },
        census: { label: 'Census', color: 'chart-5' },
      }}
      categoryKey="day"
      admissionsKey="admitted"
      dischargesKey="discharged"
      censusKey="census"
    />
  );
}

export const PatientFlowThisWeek: Story = { render: () => <Flow /> };
export const PatientFlowThisWeekDark: Story = {
  ...dark,
  render: () => <Flow />,
};

// --- ED door-to-doctor wait, by hour, against a 30-minute target ---------------------------------

const waits = [
  { hour: '08:00', p50: 12, p90: 22 },
  { hour: '09:00', p50: 16, p90: 27 },
  { hour: '10:00', p50: 22, p90: 38 },
  { hour: '11:00', p50: 28, p90: 47 },
  { hour: '12:00', p50: 34, p90: 55 },
  { hour: '13:00', p50: 26, p90: 41 },
  { hour: '14:00', p50: 19, p90: 30 },
  { hour: '15:00', p50: 15, p90: 26 },
  { hour: '16:00', p50: 18, p90: 29 },
  { hour: '17:00', p50: 24, p90: 36 },
  { hour: '18:00', p50: 31, p90: 49 },
  { hour: '19:00', p50: 27, p90: 42 },
  { hour: '20:00', p50: 20, p90: 31 },
];

function Waits() {
  return (
    <WaitTimeChart
      className="max-w-3xl"
      ariaLabel="ED door-to-doctor wait, today"
      data={waits}
      config={{
        p50: { label: 'Median wait', color: 'chart-1' },
        p90: { label: '90th percentile' },
      }}
      categoryKey="hour"
      p50Key="p50"
      p90Key="p90"
      target={30}
    />
  );
}

export const EdWaitTimeToday: Story = { render: () => <Waits /> };
export const EdWaitTimeTodayDark: Story = {
  ...dark,
  render: () => <Waits />,
};

// --- ED arrivals, day x hour, last week ----------------------------------------------------------

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// Arrivals per hour on an average weekday: quiet at night, a late-morning peak, an evening peak.
const BY_HOUR = [
  3, 2, 2, 1, 1, 2, 4, 7, 10, 13, 15, 14, 12, 11, 10, 10, 11, 13, 15, 16, 14,
  10, 7, 5,
];
const BY_DAY = [1.25, 1.05, 1, 1, 1.1, 0.85, 0.8];
const arrivals = DAYS.flatMap((day, d) =>
  BY_HOUR.map((base, hour) => ({
    day,
    hour,
    // Sunday 04:00: the triage system was down for an update.
    arrivals: day === 'Sun' && hour === 4 ? null : Math.round(base * BY_DAY[d]),
  })),
);

function Heatmap() {
  return (
    <DepartmentHeatmap
      className="max-w-3xl"
      ariaLabel="ED arrivals by day and hour, last week"
      data={arrivals}
      rowKey="day"
      columnKey="hour"
      valueKey="arrivals"
      valueLabel="ED arrivals"
      columnFormatter={(hour) => `${String(hour).padStart(2, '0')}:00`}
    />
  );
}

export const EdArrivalsHeatmap: Story = { render: () => <Heatmap /> };
export const EdArrivalsHeatmapDark: Story = {
  ...dark,
  render: () => <Heatmap />,
};

// --- The patient pathway, this month -------------------------------------------------------------

function Funnel() {
  return (
    <FunnelChart
      className="max-w-3xl"
      ariaLabel="Patient pathway, this month"
      data={[
        { stage: 'Registered', patients: 1240 },
        { stage: 'Consulted', patients: 1180 },
        { stage: 'Investigated', patients: 826 },
        { stage: 'Admitted', patients: 310 },
        { stage: 'Discharged', patients: 298 },
      ]}
      config={{ patients: { label: 'Patients', color: 'chart-1' } }}
      categoryKey="stage"
      valueKey="patients"
    />
  );
}

export const PatientPathway: Story = { render: () => <Funnel /> };
export const PatientPathwayDark: Story = {
  ...dark,
  render: () => <Funnel />,
};

// --- Gauges: bed occupancy (at most 85%) and triage SLA (at least 95%) ---------------------------

function Gauges() {
  return (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      <RadialGauge
        ariaLabel="IPD bed occupancy now"
        label="Bed occupancy"
        value={78}
        target={85}
        goal="at-most"
      />
      <RadialGauge
        ariaLabel="Triage within 15 minutes, today"
        label="Triaged within 15 min"
        value={91}
        target={95}
        goal="at-least"
        color="chart-5"
      />
    </div>
  );
}

export const OccupancyAndSlaGauges: Story = { render: () => <Gauges /> };
export const OccupancyAndSlaGaugesDark: Story = {
  ...dark,
  render: () => <Gauges />,
};

// --- Actual against target per department --------------------------------------------------------

const departments = [
  { dept: 'Cardiology', actual: 11.2, target: 10 },
  { dept: 'Gynaecology', actual: 9.6, target: 9 },
  { dept: 'Orthopaedics', actual: 6.1, target: 7.5 },
  { dept: 'Radiology', actual: 5.4, target: 6 },
  { dept: 'Laboratory', actual: 3.2, target: 3 },
];
const departmentConfig = {
  actual: { label: 'Revenue, ₹ lakh', color: 'chart-1' },
  target: { label: 'Target' },
};
const lakh = (value: number) => value.toLocaleString('en-IN');

function Bullet() {
  return (
    <ComparisonBarChart
      className="max-w-3xl"
      ariaLabel="Month-to-date revenue against target, by department"
      data={departments}
      config={departmentConfig}
      categoryKey="dept"
      actualKey="actual"
      targetKey="target"
      valueFormatter={lakh}
    />
  );
}

function Diverging() {
  return (
    <ComparisonBarChart
      className="max-w-3xl"
      ariaLabel="Revenue difference from target, by department, ₹ lakh"
      data={departments}
      config={departmentConfig}
      categoryKey="dept"
      actualKey="actual"
      targetKey="target"
      variant="diverging"
      valueFormatter={lakh}
    />
  );
}

export const ActualVsTargetBullet: Story = { render: () => <Bullet /> };
export const ActualVsTargetBulletDark: Story = {
  ...dark,
  render: () => <Bullet />,
};
export const ActualVsTargetDiverging: Story = { render: () => <Diverging /> };
export const ActualVsTargetDivergingDark: Story = {
  ...dark,
  render: () => <Diverging />,
};
