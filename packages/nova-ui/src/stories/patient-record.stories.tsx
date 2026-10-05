import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AiPanel } from '../components/ai-panel/ai-panel';
import { ApprovalBar } from '../components/approval-bar/approval-bar';
import { Avatar } from '../components/avatar/avatar';
import { Breadcrumbs } from '../components/breadcrumbs/breadcrumbs';
import { Button } from '../components/button/button';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { Chip, type ChipTone } from '../components/chip/chip';
import { EmptyState } from '../components/empty-state/empty-state';
import { Pagination } from '../components/pagination/pagination';
import { StatusDot } from '../components/status-dot/status-dot';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../components/table/table';
import { Timeline, type TimelineItem } from '../components/timeline/timeline';

// A whole screen built from the data-display and AI components, over fictional data. Flip the
// Glass / Solid and hospital-theme toolbar to see how they hold up on a real layout: the results
// table stays opaque in both materials, while the AI panel and cards take the material.
const meta = { title: 'Screens/Patient record' } satisfies Meta;

export default meta;

type Flag = 'Normal' | 'High' | 'Low' | 'Critical';

const flagTones: Record<Flag, ChipTone> = {
  Normal: 'good',
  High: 'warn',
  Low: 'warn',
  Critical: 'crit',
};

const results: Array<{
  test: string;
  value: string;
  unit: string;
  range: string;
  flag: Flag;
}> = [
  {
    test: 'Haemoglobin',
    value: '13.4',
    unit: 'g/dL',
    range: '12.0 – 15.5',
    flag: 'Normal',
  },
  {
    test: 'White cell count',
    value: '14.2',
    unit: '×10⁹/L',
    range: '4.0 – 11.0',
    flag: 'High',
  },
  {
    test: 'Platelets',
    value: '262',
    unit: '×10⁹/L',
    range: '150 – 400',
    flag: 'Normal',
  },
  {
    test: 'Haematocrit',
    value: '0.41',
    unit: 'L/L',
    range: '0.36 – 0.46',
    flag: 'Normal',
  },
  {
    test: 'Sodium',
    value: '138',
    unit: 'mmol/L',
    range: '135 – 145',
    flag: 'Normal',
  },
  {
    test: 'Potassium',
    value: '6.1',
    unit: 'mmol/L',
    range: '3.5 – 5.1',
    flag: 'Critical',
  },
  {
    test: 'Creatinine',
    value: '0.9',
    unit: 'mg/dL',
    range: '0.6 – 1.1',
    flag: 'Normal',
  },
  {
    test: 'Urea',
    value: '31',
    unit: 'mg/dL',
    range: '15 – 40',
    flag: 'Normal',
  },
  {
    test: 'C-reactive protein',
    value: '48',
    unit: 'mg/L',
    range: '< 5',
    flag: 'High',
  },
  { test: 'ALT', value: '24', unit: 'U/L', range: '7 – 35', flag: 'Normal' },
  { test: 'Albumin', value: '32', unit: 'g/L', range: '35 – 50', flag: 'Low' },
  {
    test: 'Glucose (fasting)',
    value: '5.2',
    unit: 'mmol/L',
    range: '3.9 – 5.6',
    flag: 'Normal',
  },
];

const PAGE_SIZE = 5;
const PAGE_COUNT = Math.ceil(results.length / PAGE_SIZE);

const history: TimelineItem[] = [
  {
    id: 'draft',
    time: '14 Oct, 11:20',
    title: 'Discharge summary drafted',
    description: 'Awaiting clinician review',
    tone: 'ai',
  },
  {
    id: 'potassium',
    time: '14 Oct, 09:40',
    title: 'Potassium flagged critical',
    description: '6.1 mmol/L, recheck ordered',
    tone: 'crit',
  },
  {
    id: 'antibiotics',
    time: '13 Oct, 18:05',
    title: 'Switched to oral antibiotics',
    tone: 'good',
  },
  {
    id: 'review',
    time: '11 Oct, 16:10',
    title: 'Consultant review',
    description: 'Plan agreed with the family',
    tone: 'info',
  },
  {
    id: 'admitted',
    time: '11 Oct, 09:02',
    title: 'Admitted via emergency',
    description: 'Ward 4B, bed 12',
  },
];

const approvedEvent: TimelineItem = {
  id: 'approved',
  time: '14 Oct, 11:32',
  title: 'Discharge summary approved',
  description: 'By Dr. Meera Iyer',
  tone: 'good',
};

function PatientRecord() {
  const [page, setPage] = useState(1);
  const [phase, setPhase] = useState<'draft' | 'busy' | 'approved'>('draft');

  // Stands in for the request that records the approval.
  useEffect(() => {
    if (phase !== 'busy') return;
    const timer = setTimeout(() => setPhase('approved'), 900);
    return () => clearTimeout(timer);
  }, [phase]);

  const rows = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: 'Patients', href: '#patients' },
          { label: 'Asha Rao', href: '#asha-rao' },
          { label: 'Lab results' },
        ]}
      />

      <div className="flex flex-wrap items-center gap-4">
        <Avatar name="Asha Rao" />
        <div>
          <h1 className="text-xl font-semibold text-ink">Asha Rao</h1>
          <p className="text-sm text-ink-3">
            58 years · Female · UHID HOS-004217
          </p>
        </div>
        <StatusDot tone="warn" label="Under observation" className="ml-auto" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AiPanel
            title="Discharge summary"
            state={phase === 'approved' ? 'approved' : 'draft'}
            footer={
              <ApprovalBar
                busy={phase === 'busy'}
                approvedBy={phase === 'approved' ? 'Dr. Meera Iyer' : undefined}
                onApprove={() => setPhase('busy')}
                onEdit={() => setPhase('draft')}
                onReject={() => setPhase('draft')}
              />
            }
          >
            <p>
              Admitted on 11 Oct with a chest infection and treated with
              intravenous antibiotics, changed to oral on 13 Oct. Fever settled
              within 48 hours and the white cell count and C-reactive protein
              are falling.
            </p>
            <p className="mt-3">
              Potassium was critically high on 14 Oct and a recheck is ordered.
              Discharge should wait for that result.
            </p>
          </AiPanel>

          <section
            aria-labelledby="results-title"
            className="flex flex-col gap-3"
          >
            <h2 id="results-title" className="text-base font-semibold text-ink">
              Lab results
            </h2>
            <Table
              caption={`Lab results, 14 Oct, page ${page} of ${PAGE_COUNT}`}
            >
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Test</TableHeaderCell>
                  <TableHeaderCell numeric>Result</TableHeaderCell>
                  <TableHeaderCell>Unit</TableHeaderCell>
                  <TableHeaderCell numeric>Reference range</TableHeaderCell>
                  <TableHeaderCell>Flag</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.test}>
                    <TableHeaderCell scope="row">{row.test}</TableHeaderCell>
                    <TableCell numeric>{row.value}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell numeric>{row.range}</TableCell>
                    <TableCell>
                      <Chip tone={flagTones[row.flag]}>{row.flag}</Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={page}
              pageCount={PAGE_COUNT}
              onPageChange={setPage}
              aria-label="Lab results pages"
              className="self-end"
            />
          </section>

          <section
            aria-labelledby="imaging-title"
            className="flex flex-col gap-3"
          >
            <h2 id="imaging-title" className="text-base font-semibold text-ink">
              Imaging
            </h2>
            <EmptyState
              title="No imaging this admission"
              description="Studies appear here once radiology has reported them."
              action={
                <Button variant="secondary" size="sm">
                  Request imaging
                </Button>
              }
            />
          </section>
        </div>

        <Card className="self-start">
          <CardHeader title="Event history" description="Most recent first" />
          <CardBody>
            <Timeline
              aria-label="Event history"
              items={
                phase === 'approved' ? [approvedEvent, ...history] : history
              }
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export const LabResultsAndDischarge: StoryObj = {
  render: () => <PatientRecord />,
};
