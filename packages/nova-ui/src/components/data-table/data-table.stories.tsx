import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { Chip, type ChipTone } from '../chip/chip';
import { MenuItem } from '../menu/menu';
import { DataTable, type DataTableColumn } from './data-table';
import { filterRows, sortRows } from './table-model';
import type { PaginationState, SortState } from './types';

// Every row here is generated: invented names and numbers from a seeded sequence, never real
// patient data.
interface Patient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  sex: 'F' | 'M';
  ward: string;
  admitted: Date;
  status: PatientStatus;
  balance: number;
}

type PatientStatus = 'Stable' | 'Observation' | 'Critical' | 'Discharged';

const STATUS_TONES: Record<PatientStatus, ChipTone> = {
  Stable: 'good',
  Observation: 'warn',
  Critical: 'crit',
  Discharged: 'neutral',
};

const FIRST = [
  'Asha',
  'Bharat',
  'Chitra',
  'Dev',
  'Esha',
  'Farid',
  'Gauri',
  'Harsh',
  'Indira',
  'Jaya',
  'Kiran',
  'Lakshmi',
  'Manoj',
  'Nila',
  'Omkar',
  'Priya',
];
const LAST = [
  'Rao',
  'Nair',
  'Iyer',
  'Reddy',
  'Menon',
  'Pillai',
  'Verma',
  'Sharma',
  'Das',
  'Kulkarni',
];
const WARDS = ['ICU', 'General', 'Orthopaedics', 'Maternity', 'Paediatrics'];
const STATUSES: PatientStatus[] = [
  'Stable',
  'Stable',
  'Observation',
  'Critical',
  'Discharged',
];

// A small linear congruential sequence: the same 312 patients on every render.
function generatePatients(count: number): Patient[] {
  let seed = 7;
  const next = (max: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % max;
  };
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    mrn: `MRN-${String(100200 + index * 3)}`,
    name: `${FIRST[next(FIRST.length)]} ${LAST[next(LAST.length)]}`,
    age: 1 + next(90),
    sex: next(2) === 0 ? 'F' : 'M',
    ward: WARDS[next(WARDS.length)] as string,
    admitted: new Date(Date.UTC(2026, 8, 1 + next(28))),
    status: STATUSES[next(STATUSES.length)] as PatientStatus,
    balance: next(90000),
  }));
}

const PATIENTS = generatePatients(312);

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const columns: DataTableColumn<Patient>[] = [
  {
    id: 'name',
    header: 'Patient',
    accessor: (p) => p.name,
    sortable: true,
    nowrap: true,
    cell: (p) => (
      <span className="font-semibold">
        {p.name}
        <span className="ml-s3 font-normal text-ink-2">
          {p.age}
          {p.sex}
        </span>
      </span>
    ),
    searchValue: (p) => `${p.name} ${p.mrn}`,
  },
  {
    id: 'mrn',
    header: 'MRN',
    accessor: (p) => p.mrn,
    sortable: true,
    mono: true,
    hideable: true,
    nowrap: true,
    searchValue: false,
  },
  {
    id: 'age',
    header: 'Age',
    accessor: (p) => p.age,
    sortable: true,
    numeric: true,
    hideable: true,
    searchValue: false,
  },
  {
    id: 'ward',
    header: 'Ward',
    accessor: (p) => p.ward,
    sortable: true,
    hideable: true,
  },
  {
    id: 'admitted',
    header: 'Admitted',
    accessor: (p) => p.admitted,
    sortable: true,
    hideable: true,
    nowrap: true,
    cell: (p) =>
      p.admitted.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }),
    searchValue: false,
  },
  {
    id: 'status',
    header: 'Status',
    accessor: (p) => p.status,
    sortable: true,
    hideable: true,
    // The chip carries the status as a word as well as a colour.
    cell: (p) => <Chip tone={STATUS_TONES[p.status]}>{p.status}</Chip>,
  },
  {
    id: 'balance',
    header: 'Balance due',
    accessor: (p) => p.balance,
    sortable: true,
    numeric: true,
    hideable: true,
    nowrap: true,
    cell: (p) => rupees.format(p.balance),
    searchValue: false,
  },
];

const meta = {
  title: 'Components/DataTable',
  component: DataTable<Patient>,
  parameters: { layout: 'padded' },
  // The controls panel starts from the Patients table; each story below builds its own.
  args: {
    caption: 'Patients',
    columns,
    rows: PATIENTS,
    getRowId: (p) => p.id,
  },
} satisfies Meta<typeof DataTable<Patient>>;

export default meta;
type Story = StoryObj<typeof meta>;

// The full set at once: sorting (click a header), 312 rows in pages with a page size, search,
// the Columns menu, density, a sticky header inside a scroll area, a pinned first column, row
// selection with a bulk bar, row actions and arrow-key row navigation.
export const Patients: Story = {
  render: () => (
    <DataTable<Patient>
      caption="Patients"
      columns={columns}
      rows={PATIENTS}
      getRowId={(p) => p.id}
      getRowLabel={(p) => p.name}
      searchPlaceholder="Search name, MRN, ward or status"
      selectable
      stickyFirstColumn
      keyboardNavigation
      maxHeight="var(--nova-measure-md)"
      bulkActions={({ selectedRows }) => (
        <>
          <Button size="sm" variant="outline">
            Assign ward
          </Button>
          <Button size="sm" variant="outline">
            Export {selectedRows.length}
          </Button>
        </>
      )}
      rowActions={(p) => (
        <>
          <MenuItem>Open chart for {p.name}</MenuItem>
          <MenuItem>Print wristband</MenuItem>
          <MenuItem>Transfer ward</MenuItem>
        </>
      )}
    />
  ),
};

// Sorting, searching and paging done by a "server": the table shows the rows it is handed, the
// total comes from rowCount, and each change asks for a new page. The delay stands in for the
// network, so the loading state shows between pages.
function ServerDemo() {
  const [sort, setSort] = useState<SortState | null>(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
  });
  const [result, setResult] = useState<{ rows: Patient[]; total: number }>({
    rows: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const matched = sortRows(
        filterRows(PATIENTS, columns, search),
        columns,
        sort,
      );
      const start = (pagination.page - 1) * pagination.pageSize;
      setResult({
        rows: matched.slice(start, start + pagination.pageSize),
        total: matched.length,
      });
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [sort, search, pagination]);

  return (
    <DataTable<Patient>
      caption="Patients, from the server"
      manual
      columns={columns}
      rows={result.rows}
      rowCount={result.total}
      getRowId={(p) => p.id}
      getRowLabel={(p) => p.name}
      loading={loading}
      loadingRows={pagination.pageSize > 10 ? 10 : pagination.pageSize}
      sort={sort}
      onSortChange={setSort}
      search={search}
      onSearchChange={setSearch}
      pagination={pagination}
      onPaginationChange={setPagination}
      selectable
    />
  );
}

export const ServerMode: Story = { render: () => <ServerDemo /> };

export const Loading: Story = {
  render: () => (
    <DataTable<Patient>
      caption="Patients, loading"
      columns={columns}
      rows={[]}
      getRowId={(p) => p.id}
      loading
      loadingRows={8}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <DataTable<Patient>
      caption="Patients, none admitted"
      columns={columns}
      rows={[]}
      getRowId={(p) => p.id}
      emptyState={
        <div className="flex flex-col items-center gap-s5 py-s9 text-center">
          <p className="font-display text-title font-semibold">
            No patients admitted
          </p>
          <p className="text-control text-ink-2">
            New admissions appear here as soon as they are registered.
          </p>
          <Button size="sm">Register a patient</Button>
        </div>
      }
    />
  ),
};

// The built-in copy for a search that matches nothing, with its way back.
export const NoResults: Story = {
  render: () => (
    <DataTable<Patient>
      caption="Patients, no match"
      columns={columns}
      rows={PATIENTS}
      getRowId={(p) => p.id}
      defaultSearch="Zzyzx"
    />
  ),
};

export const ErrorState: Story = {
  render: () => (
    <DataTable<Patient>
      caption="Patients, failed to load"
      columns={columns}
      rows={[]}
      getRowId={(p) => p.id}
      error={
        <div className="flex flex-col items-start gap-s5">
          <p className="text-control font-semibold text-crit-deep">
            Could not load patients. Check your connection and try again.
          </p>
          <Button size="sm" variant="outline">
            Retry
          </Button>
        </div>
      }
    />
  ),
};

export const Compact: Story = {
  render: () => (
    <DataTable<Patient>
      caption="Patients, compact"
      columns={columns}
      rows={PATIENTS.slice(0, 60)}
      getRowId={(p) => p.id}
      getRowLabel={(p) => p.name}
      defaultDensity="compact"
      defaultPagination={{ page: 1, pageSize: 25 }}
    />
  ),
};
