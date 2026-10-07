import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { Button } from '../button/button';
import { MenuItem } from '../menu/menu';
import { DataTable, type DataTableProps } from './data-table';
import type { DataTableColumn, SortState } from './types';

afterEach(() => cleanup());

interface Patient {
  id: string;
  name: string;
  age: number;
  ward: string;
  admitted: string;
}

const WARDS = ['ICU', 'General', 'Ortho'];

function makePatients(count: number): Patient[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Patient ${String(index + 1).padStart(2, '0')}`,
    age: 20 + ((index * 7) % 60),
    ward: WARDS[index % WARDS.length] as string,
    admitted: `2026-01-${String(1 + (index % 28)).padStart(2, '0')}`,
  }));
}

const columns: DataTableColumn<Patient>[] = [
  { id: 'name', header: 'Name', accessor: (p) => p.name, sortable: true },
  {
    id: 'mrn',
    header: 'MRN',
    accessor: (p) => p.id.toUpperCase(),
    mono: true,
    hideable: true,
  },
  {
    id: 'age',
    header: 'Age',
    accessor: (p) => p.age,
    sortable: true,
    numeric: true,
    hideable: true,
  },
  {
    id: 'ward',
    header: 'Ward',
    accessor: (p) => p.ward,
    sortable: true,
    hideable: true,
  },
];

function table(props: Partial<DataTableProps<Patient>> = {}) {
  return (
    <DataTable<Patient>
      caption="Patients"
      columns={columns}
      rows={makePatients(30)}
      getRowId={(p) => p.id}
      getRowLabel={(p) => p.name}
      defaultPagination={{ page: 1, pageSize: 10 }}
      {...props}
    />
  );
}

function renderTable(props: Partial<DataTableProps<Patient>> = {}) {
  return render(table(props));
}

const bodyRows = () =>
  Array.from(document.querySelectorAll<HTMLElement>('tbody tr'));

// The text of the Name column, row by row (the first data column).
function names(): string[] {
  return bodyRows().map(
    (row) =>
      row.querySelector('[data-column="name"]')?.textContent?.trim() ?? '',
  );
}

const header = (name: string) =>
  screen.getByRole('columnheader', { name: new RegExp(`^${name}`) });

describe('DataTable: the data model', () => {
  it('is a table named by its caption, with a header and a cell per column', () => {
    renderTable();
    const grid = screen.getByRole('table', { name: 'Patients' });
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(4);
    expect(names()[0]).toBe('Patient 01');
    expect(bodyRows()[0]?.textContent).toContain('P1');
  });

  it('draws a cell with the column renderer when it has one, and passes the row index', () => {
    const cols: DataTableColumn<Patient>[] = [
      {
        id: 'name',
        header: 'Name',
        cell: (p, { rowIndex }) => `${rowIndex}:${p.name.toUpperCase()}`,
      },
    ];
    renderTable({ columns: cols });
    expect(bodyRows()[0]?.textContent).toBe('0:PATIENT 01');
    expect(bodyRows()[1]?.textContent).toBe('1:PATIENT 02');
  });

  it('right-aligns a numeric column in tabular numerals and sets a mono column in mono', () => {
    renderTable();
    const row = bodyRows()[0] as HTMLElement;
    const age = row.querySelector('[data-column="age"]') as HTMLElement;
    expect(age.classList.contains('text-right')).toBe(true);
    expect(age.classList.contains('tabular-nums')).toBe(true);
    const mrn = row.querySelector('[data-column="mrn"]') as HTMLElement;
    expect(mrn.classList.contains('font-mono')).toBe(true);
    expect(header('Age').classList.contains('text-right')).toBe(true);
  });

  it('shows a dash where a value is missing', () => {
    renderTable({
      columns: [
        { id: 'x', header: 'Note', accessor: () => null },
        { id: 'y', header: 'Other', accessor: () => undefined },
      ],
    });
    expect(bodyRows()[0]?.textContent).toBe('——');
  });

  it('applies a column width to its header', () => {
    renderTable({
      columns: [
        { id: 'name', header: 'Name', accessor: (p) => p.name, width: '12rem' },
      ],
    });
    expect(header('Name').style.width).toBe('12rem');
  });

  it('numbers the rows for assistive technology, the header being row 1', () => {
    renderTable();
    const grid = screen.getByRole('table', { name: 'Patients' });
    expect(grid.getAttribute('aria-rowcount')).toBe('31');
    expect(bodyRows()[0]?.getAttribute('aria-rowindex')).toBe('2');
    expect(bodyRows()[9]?.getAttribute('aria-rowindex')).toBe('11');
  });

  it('draws a per-column filter under its header text', () => {
    renderTable({
      columns: [
        {
          id: 'ward',
          header: 'Ward',
          accessor: (p) => p.ward,
          filter: <input aria-label="Filter ward" />,
        },
      ],
    });
    expect(header('Ward').contains(screen.getByLabelText('Filter ward'))).toBe(
      true,
    );
  });

  it('renders a toolbar slot', () => {
    renderTable({ toolbar: <button type="button">Export</button> });
    expect(screen.getByRole('button', { name: 'Export' })).toBeTruthy();
  });
});

describe('DataTable: sorting', () => {
  it('makes a sortable header a button and leaves other headers as text', () => {
    renderTable();
    expect(within(header('Name')).getByRole('button')).toBeTruthy();
    expect(within(header('MRN')).queryByRole('button')).toBeNull();
  });

  it('cycles a header none, ascending, descending, none, and reorders the rows', () => {
    renderTable({ defaultPagination: { page: 1, pageSize: 100 } });
    const button = () => within(header('Age')).getByRole('button');
    const ages = () =>
      bodyRows().map((row) =>
        Number(row.querySelector('[data-column="age"]')?.textContent),
      );
    const original = ages();

    fireEvent.click(button());
    expect(header('Age').getAttribute('aria-sort')).toBe('ascending');
    expect(ages()).toEqual([...original].sort((a, b) => a - b));

    fireEvent.click(button());
    expect(header('Age').getAttribute('aria-sort')).toBe('descending');
    expect(ages()).toEqual([...original].sort((a, b) => b - a));

    fireEvent.click(button());
    expect(header('Age').getAttribute('aria-sort')).toBe('none');
    expect(ages()).toEqual(original);
  });

  it('puts aria-sort on the th: none on idle sortable headers, nothing on the rest', () => {
    renderTable();
    expect(header('Name').getAttribute('aria-sort')).toBe('none');
    expect(header('MRN').hasAttribute('aria-sort')).toBe(false);
  });

  it('sorts one column at a time', () => {
    renderTable();
    fireEvent.click(within(header('Name')).getByRole('button'));
    fireEvent.click(within(header('Age')).getByRole('button'));
    expect(header('Name').getAttribute('aria-sort')).toBe('none');
    expect(header('Age').getAttribute('aria-sort')).toBe('ascending');
  });

  it('shows the direction as an arrow shape, not by colour', () => {
    renderTable({ defaultSort: { columnId: 'age', direction: 'desc' } });
    expect(
      within(header('Age'))
        .getByRole('button')
        .querySelector('[data-sort="desc"]'),
    ).toBeTruthy();
    expect(
      within(header('Name'))
        .getByRole('button')
        .querySelector('[data-sort="none"]'),
    ).toBeTruthy();
  });

  it('starts from defaultSort when uncontrolled', () => {
    renderTable({ defaultSort: { columnId: 'name', direction: 'desc' } });
    expect(header('Name').getAttribute('aria-sort')).toBe('descending');
    expect(names()[0]).toBe('Patient 30');
  });

  it('is controlled by sort: it reports the change and waits for the caller', () => {
    const onSortChange = vi.fn();
    renderTable({ sort: null, onSortChange });
    fireEvent.click(within(header('Name')).getByRole('button'));
    expect(onSortChange).toHaveBeenCalledWith({
      columnId: 'name',
      direction: 'asc',
    });
    expect(header('Name').getAttribute('aria-sort')).toBe('none');
  });

  it('follows a controlled sort that changes', () => {
    function Controlled() {
      const [sort, setSort] = useState<SortState | null>(null);
      return table({ sort, onSortChange: setSort });
    }
    render(<Controlled />);
    fireEvent.click(within(header('Name')).getByRole('button'));
    expect(header('Name').getAttribute('aria-sort')).toBe('ascending');
  });

  it('announces the sort in a polite live region', () => {
    renderTable();
    fireEvent.click(within(header('Name')).getByRole('button'));
    expect(screen.getByText('Sorted by Name, ascending')).toBeTruthy();
    fireEvent.click(within(header('Name')).getByRole('button'));
    expect(screen.getByText('Sorted by Name, descending')).toBeTruthy();
    fireEvent.click(within(header('Name')).getByRole('button'));
    expect(screen.getByText('Sort cleared')).toBeTruthy();
  });

  it('returns to the first page when the sort changes', () => {
    renderTable();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Showing 11–20 of 30')).toBeTruthy();
    fireEvent.click(within(header('Name')).getByRole('button'));
    expect(screen.getByText('Showing 1–10 of 30')).toBeTruthy();
  });
});

describe('DataTable: pagination', () => {
  it('shows a page, the range label and the page controls', () => {
    renderTable();
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText('Showing 1–10 of 30')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy();
  });

  it('defaults to 25 a page', () => {
    renderTable({ defaultPagination: undefined });
    expect(bodyRows()).toHaveLength(25);
    expect(screen.getByText('Showing 1–25 of 30')).toBeTruthy();
  });

  it('moves between pages', () => {
    renderTable();
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(names()[0]).toBe('Patient 21');
    expect(screen.getByText('Showing 21–30 of 30')).toBeTruthy();
  });

  it('offers 10, 25, 50 and 100 rows a page, and a new size starts again from page 1', () => {
    renderTable();
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    fireEvent.change(screen.getByLabelText('Rows per page'), {
      target: { value: '25' },
    });
    expect(bodyRows()).toHaveLength(25);
    expect(screen.getByText('Showing 1–25 of 30')).toBeTruthy();
  });

  it('is controlled by pagination', () => {
    const onPaginationChange = vi.fn();
    renderTable({
      pagination: { page: 2, pageSize: 10 },
      onPaginationChange,
    });
    expect(names()[0]).toBe('Patient 11');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPaginationChange).toHaveBeenCalledWith({ page: 3, pageSize: 10 });
    expect(names()[0]).toBe('Patient 11');
  });

  it('reads a controlled page past the end as the last page', () => {
    renderTable({ pagination: { page: 9, pageSize: 10 } });
    expect(names()[0]).toBe('Patient 21');
  });

  it('shows every row and no footer when paginate is false', () => {
    renderTable({ paginate: false });
    expect(bodyRows()).toHaveLength(30);
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).toBeNull();
  });

  it('lets the server do the work in manual mode: rows are the page, rowCount is the total', () => {
    const onPaginationChange = vi.fn();
    const onSortChange = vi.fn();
    const onSearchChange = vi.fn();
    renderTable({
      manual: true,
      rows: makePatients(10),
      rowCount: 312,
      onPaginationChange,
      onSortChange,
      onSearchChange,
    });
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText('Showing 1–10 of 312')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Page 32' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPaginationChange).toHaveBeenCalledWith({ page: 2, pageSize: 10 });

    fireEvent.click(within(header('Name')).getByRole('button'));
    fireEvent.click(within(header('Name')).getByRole('button'));
    expect(onSortChange).toHaveBeenLastCalledWith({
      columnId: 'name',
      direction: 'desc',
    });
    // The rows are the caller's to order: the table does not reorder them.
    expect(names()[0]).toBe('Patient 01');

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'zzz' },
    });
    expect(onSearchChange).toHaveBeenLastCalledWith('zzz');
    expect(bodyRows()).toHaveLength(10);
  });

  it('numbers manual rows from the page they belong to', () => {
    renderTable({
      manual: true,
      rows: makePatients(10),
      rowCount: 312,
      pagination: { page: 3, pageSize: 10 },
    });
    expect(bodyRows()[0]?.getAttribute('aria-rowindex')).toBe('22');
    expect(
      screen
        .getByRole('table', { name: 'Patients' })
        .getAttribute('aria-rowcount'),
    ).toBe('313');
  });
});

describe('DataTable: row selection', () => {
  it('adds a checkbox per row and a select-all in the header', () => {
    renderTable({ selectable: true });
    expect(screen.getByLabelText('Select all rows on this page')).toBeTruthy();
    expect(screen.getByLabelText('Select Patient 01')).toBeTruthy();
    expect(screen.getAllByRole('checkbox')).toHaveLength(11);
  });

  it('selects a row, tints it and announces it with aria-selected', () => {
    renderTable({ selectable: true });
    fireEvent.click(screen.getByLabelText('Select Patient 02'));
    const row = bodyRows()[1] as HTMLElement;
    expect(row.getAttribute('aria-selected')).toBe('true');
    expect(bodyRows()[0]?.hasAttribute('aria-selected')).toBe(false);
  });

  it('shows the header box as indeterminate when only some of the page is selected', () => {
    renderTable({ selectable: true });
    const all = screen.getByLabelText(
      'Select all rows on this page',
    ) as HTMLInputElement;
    expect(all.indeterminate).toBe(false);
    fireEvent.click(screen.getByLabelText('Select Patient 01'));
    expect(all.indeterminate).toBe(true);
    expect(all.checked).toBe(false);
  });

  it('selects only the rows on the current page, and deselects them again', () => {
    renderTable({ selectable: true });
    const all = screen.getByLabelText(
      'Select all rows on this page',
    ) as HTMLInputElement;
    fireEvent.click(all);
    expect(screen.getByText('10 selected')).toBeTruthy();
    expect(all.checked).toBe(true);
    expect(all.indeterminate).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(all.checked).toBe(false);
    fireEvent.click(all);
    expect(screen.getByText('20 selected')).toBeTruthy();

    fireEvent.click(all);
    expect(screen.getByText('10 selected')).toBeTruthy();
  });

  it('shows a bulk-action bar with the count and the caller actions', () => {
    const onArchive = vi.fn();
    renderTable({
      selectable: true,
      bulkActions: ({ selectedIds, selectedRows }) => (
        <Button size="sm" onClick={() => onArchive(selectedIds, selectedRows)}>
          Archive
        </Button>
      ),
    });
    expect(screen.queryByRole('region', { name: 'Bulk actions' })).toBeNull();
    fireEvent.click(screen.getByLabelText('Select Patient 01'));
    fireEvent.click(screen.getByLabelText('Select Patient 03'));
    const bar = screen.getByRole('region', { name: 'Bulk actions' });
    expect(within(bar).getByText('2 selected')).toBeTruthy();
    fireEvent.click(within(bar).getByRole('button', { name: 'Archive' }));
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onArchive.mock.calls[0]?.[0]).toEqual(['p1', 'p3']);
    expect(
      (onArchive.mock.calls[0]?.[1] as Patient[]).map((p) => p.name),
    ).toEqual(['Patient 01', 'Patient 03']);
  });

  it('clears the selection from the bar', () => {
    renderTable({ selectable: true });
    fireEvent.click(screen.getByLabelText('Select Patient 01'));
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryByRole('region', { name: 'Bulk actions' })).toBeNull();
    expect(
      (screen.getByLabelText('Select Patient 01') as HTMLInputElement).checked,
    ).toBe(false);
  });

  it('is controlled by selectedRowIds', () => {
    const onSelectedRowIdsChange = vi.fn();
    renderTable({
      selectable: true,
      selectedRowIds: ['p2'],
      onSelectedRowIdsChange,
    });
    expect(
      (screen.getByLabelText('Select Patient 02') as HTMLInputElement).checked,
    ).toBe(true);
    fireEvent.click(screen.getByLabelText('Select Patient 04'));
    expect(onSelectedRowIdsChange).toHaveBeenCalledWith(['p2', 'p4']);
    expect(
      (screen.getByLabelText('Select Patient 04') as HTMLInputElement).checked,
    ).toBe(false);
  });

  it('starts from defaultSelectedRowIds', () => {
    renderTable({ selectable: true, defaultSelectedRowIds: ['p1', 'p2'] });
    expect(screen.getByText('2 selected')).toBeTruthy();
  });

  it('is not selectable unless asked', () => {
    renderTable();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
});

describe('DataTable: search and filter', () => {
  const withRamesh = () => [
    ...makePatients(28),
    {
      id: 'r1',
      name: 'Ramesh Rao',
      age: 54,
      ward: 'ICU',
      admitted: '2026-02-01',
    },
    {
      id: 'r2',
      name: 'Ramesh Iyer',
      age: 61,
      ward: 'Ortho',
      admitted: '2026-02-02',
    },
  ];

  it('filters the rows as you type, case-insensitively, across every column', () => {
    renderTable({ rows: withRamesh() });
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'RAMESH' },
    });
    expect(names()).toEqual(['Ramesh Rao', 'Ramesh Iyer']);
    expect(screen.getByText('Showing 1–2 of 2')).toBeTruthy();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'ramesh ortho' },
    });
    expect(names()).toEqual(['Ramesh Iyer']);
  });

  it('goes back to page 1 when the search changes', () => {
    renderTable({ rows: withRamesh() });
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'ramesh' },
    });
    expect(screen.getByText('Showing 1–2 of 2')).toBeTruthy();
  });

  it('reports the search and can be controlled', () => {
    const onSearchChange = vi.fn();
    renderTable({ search: 'Ramesh', onSearchChange, rows: withRamesh() });
    expect(names()).toEqual(['Ramesh Rao', 'Ramesh Iyer']);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'Ramesh R' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('Ramesh R');
    expect(
      (screen.getByRole('searchbox', { name: 'Search' }) as HTMLInputElement)
        .value,
    ).toBe('Ramesh');
  });

  it('takes a custom search label and placeholder', () => {
    renderTable({
      searchLabel: 'Find a patient',
      searchPlaceholder: 'Name or ward',
    });
    const box = screen.getByRole('searchbox', { name: 'Find a patient' });
    expect(box.getAttribute('placeholder')).toBe('Name or ward');
  });

  it('leaves the search box out when searchable is false', () => {
    renderTable({ searchable: false });
    expect(screen.queryByRole('searchbox')).toBeNull();
  });
});

describe('DataTable: column visibility', () => {
  it('lists only the hideable columns, as checkable menu items, all checked', () => {
    renderTable();
    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    const items = screen.getAllByRole('menuitemcheckbox');
    expect(items.map((item) => item.textContent)).toEqual([
      'MRN',
      'Age',
      'Ward',
    ]);
    for (const item of items) {
      expect(item.getAttribute('aria-checked')).toBe('true');
    }
  });

  it('hides and shows a column, and keeps the menu open for the next one', () => {
    renderTable();
    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Age' }));
    expect(screen.queryByRole('columnheader', { name: /^Age/ })).toBeNull();
    expect(document.querySelector('[data-column="age"]')).toBeNull();
    expect(
      screen
        .getByRole('menuitemcheckbox', { name: 'Age' })
        .getAttribute('aria-checked'),
    ).toBe('false');
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Age' }));
    expect(screen.getByRole('columnheader', { name: /^Age/ })).toBeTruthy();
  });

  it('starts with defaultHidden columns hidden', () => {
    renderTable({
      columns: columns.map((c) =>
        c.id === 'ward' ? { ...c, defaultHidden: true } : c,
      ),
    });
    expect(screen.queryByRole('columnheader', { name: /^Ward/ })).toBeNull();
  });

  it('is controlled by hiddenColumnIds', () => {
    const onHiddenColumnIdsChange = vi.fn();
    renderTable({ hiddenColumnIds: ['mrn'], onHiddenColumnIdsChange });
    expect(screen.queryByRole('columnheader', { name: /^MRN/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Age' }));
    expect(onHiddenColumnIdsChange).toHaveBeenCalledWith(['mrn', 'age']);
  });

  it('has no Columns menu when no column can be hidden', () => {
    renderTable({ columns: columns.map((c) => ({ ...c, hideable: false })) });
    expect(screen.queryByRole('button', { name: 'Columns' })).toBeNull();
  });
});

describe('DataTable: density', () => {
  it('toggles between comfortable and compact, and says which is on', () => {
    renderTable();
    const comfortable = screen.getByRole('button', { name: 'Comfortable' });
    const compact = screen.getByRole('button', { name: 'Compact' });
    expect(comfortable.getAttribute('aria-pressed')).toBe('true');
    expect(compact.getAttribute('aria-pressed')).toBe('false');
    expect(
      bodyRows()[0]
        ?.querySelector('td')
        ?.classList.contains('py-row-comfortable'),
    ).toBe(true);

    fireEvent.click(compact);
    expect(compact.getAttribute('aria-pressed')).toBe('true');
    expect(
      bodyRows()[0]?.querySelector('td')?.classList.contains('py-row-compact'),
    ).toBe(true);
  });

  it('is controlled by density', () => {
    const onDensityChange = vi.fn();
    renderTable({ density: 'compact', onDensityChange });
    fireEvent.click(screen.getByRole('button', { name: 'Comfortable' }));
    expect(onDensityChange).toHaveBeenCalledWith('comfortable');
    expect(
      screen
        .getByRole('button', { name: 'Compact' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('can leave the toggle out', () => {
    renderTable({ densityToggle: false });
    expect(screen.queryByRole('button', { name: 'Compact' })).toBeNull();
  });
});

describe('DataTable: scrolling', () => {
  it('scrolls inside a max-height region with a sticky header', () => {
    renderTable({ maxHeight: '24rem' });
    const region = screen.getByRole('region', { name: 'Patients' });
    expect(region.style.maxHeight).toBe('24rem');
    expect(header('Name').classList.contains('sticky')).toBe(true);
    expect(header('Name').classList.contains('top-0')).toBe(true);
  });

  it('can turn the sticky header off', () => {
    renderTable({ stickyHeader: false });
    expect(header('Name').classList.contains('sticky')).toBe(false);
  });

  it('pins the first column, after the select column when there is one', () => {
    renderTable({ stickyFirstColumn: true, selectable: true });
    const firstRow = bodyRows()[0] as HTMLElement;
    const select = firstRow.querySelector('td') as HTMLElement;
    const name = firstRow.querySelector('[data-column="name"]') as HTMLElement;
    expect(select.classList.contains('sticky')).toBe(true);
    expect(select.classList.contains('left-0')).toBe(true);
    expect(name.classList.contains('sticky')).toBe(true);
    expect(name.classList.contains('left-table-select')).toBe(true);
    expect(header('Name').classList.contains('left-table-select')).toBe(true);
  });

  it('pins the first column at the edge when there is no select column', () => {
    renderTable({ stickyFirstColumn: true });
    const name = bodyRows()[0]?.querySelector('[data-column="name"]');
    expect(name?.classList.contains('left-0')).toBe(true);
  });
});

describe('DataTable: row actions', () => {
  it('adds a menu per row, named for the row, with the caller items', () => {
    const onOpen = vi.fn();
    renderTable({
      rowActions: (patient) => (
        <MenuItem onClick={() => onOpen(patient.id)}>Open chart</MenuItem>
      ),
    });
    expect(
      screen.getAllByRole('button', { name: /^Actions for/ }),
    ).toHaveLength(10);
    fireEvent.click(
      screen.getByRole('button', { name: 'Actions for Patient 02' }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Open chart' }));
    expect(onOpen).toHaveBeenCalledWith('p2');
  });

  it('labels the actions column for screen readers without a visible header', () => {
    renderTable({ rowActions: () => <MenuItem>Open</MenuItem> });
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeTruthy();
  });
});

describe('DataTable: states', () => {
  it('shows shimmer rows while loading, motion-safe, and marks the table busy', () => {
    renderTable({ loading: true, loadingRows: 6 });
    expect(document.querySelectorAll('[data-skeleton-row]')).toHaveLength(6);
    expect(
      screen.getByRole('table', { name: 'Patients' }).getAttribute('aria-busy'),
    ).toBe('true');
    expect(screen.queryByText('Patient 01')).toBeNull();
    expect(screen.getByText('Loading rows')).toBeTruthy();
    const bar = document.querySelector('[data-skeleton-row] [data-skeleton]');
    expect(bar?.classList.contains('motion-safe:animate-pulse')).toBe(true);
    expect(bar?.classList.contains('animate-pulse')).toBe(false);
  });

  it('does not claim "Showing 0 of 0" while the first rows are still on their way', () => {
    renderTable({ loading: true, rows: [] });
    expect(screen.queryByText('Showing 0 of 0')).toBeNull();
  });

  it('keeps the header and sorting available while loading', () => {
    renderTable({ loading: true });
    expect(within(header('Name')).getByRole('button')).toBeTruthy();
  });

  it('says there is no data, with its own copy, when there are no rows', () => {
    renderTable({ rows: [] });
    expect(
      screen.getByRole('heading', { name: 'Nothing here yet' }),
    ).toBeTruthy();
    expect(bodyRows()).toHaveLength(1);
    expect(screen.getByText('Showing 0 of 0')).toBeTruthy();
  });

  it('takes a caller empty state in place of the default', () => {
    renderTable({ rows: [], emptyState: <p>No patients admitted.</p> });
    expect(screen.getByText('No patients admitted.')).toBeTruthy();
    expect(screen.queryByText('Nothing here yet')).toBeNull();
  });

  it('says what was searched for when a search finds nothing, and clears it', () => {
    renderTable();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'zzz' },
    });
    expect(
      screen.getByRole('heading', { name: 'No results for “zzz”' }),
    ).toBeTruthy();
    expect(screen.queryByText('Nothing here yet')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(bodyRows()).toHaveLength(10);
  });

  it('takes a caller no-results state', () => {
    renderTable({
      search: 'zzz',
      noResultsState: <p>Nobody matches.</p>,
    });
    expect(screen.getByText('Nobody matches.')).toBeTruthy();
  });

  it('shows an error slot in place of the rows, as an alert', () => {
    renderTable({ error: <p>Could not load patients.</p> });
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Could not load patients.');
    expect(screen.queryByText('Patient 01')).toBeNull();
  });
});

describe('DataTable: keyboard', () => {
  it('reaches the sort buttons, the controls and the pager by Tab, never with a negative tabindex', () => {
    renderTable({ selectable: true });
    const stops = [
      ...screen.getAllByRole('button'),
      ...screen.getAllByRole('checkbox'),
      screen.getByRole('searchbox'),
    ];
    for (const stop of stops) {
      expect(stop.getAttribute('tabindex')).not.toBe('-1');
    }
  });

  it('moves between rows with the arrow keys when keyboardNavigation is on', () => {
    renderTable({ keyboardNavigation: true });
    const rows = bodyRows();
    expect(rows[0]?.getAttribute('tabindex')).toBe('0');
    expect(rows[1]?.getAttribute('tabindex')).toBe('-1');
    rows[0]?.focus();
    fireEvent.keyDown(rows[0] as HTMLElement, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(rows[1]);
    expect(rows[1]?.getAttribute('tabindex')).toBe('0');
    expect(rows[0]?.getAttribute('tabindex')).toBe('-1');
    fireEvent.keyDown(rows[1] as HTMLElement, { key: 'End' });
    expect(document.activeElement).toBe(rows[9]);
    fireEvent.keyDown(rows[9] as HTMLElement, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(rows[8]);
    fireEvent.keyDown(rows[8] as HTMLElement, { key: 'Home' });
    expect(document.activeElement).toBe(rows[0]);
  });

  it('leaves arrow keys alone inside a row control, such as a checkbox', () => {
    renderTable({ keyboardNavigation: true, selectable: true });
    const box = screen.getByLabelText('Select Patient 01');
    box.focus();
    const proceed = fireEvent.keyDown(box, { key: 'ArrowDown' });
    expect(proceed).toBe(true);
    expect(document.activeElement).toBe(box);
  });

  it('toggles the focused row with Space when rows are selectable', () => {
    renderTable({ keyboardNavigation: true, selectable: true });
    const row = bodyRows()[0] as HTMLElement;
    row.focus();
    fireEvent.keyDown(row, { key: ' ' });
    expect(row.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(row, { key: ' ' });
    expect(row.hasAttribute('aria-selected')).toBe(false);
  });

  it('does not make rows tab stops by default', () => {
    renderTable();
    expect(bodyRows()[0]?.hasAttribute('tabindex')).toBe(false);
  });
});

describe('DataTable: health data stays out of the logs', () => {
  it('writes nothing to the console while searching, selecting, sorting and paging', () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    try {
      renderTable({ selectable: true });
      fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
        target: { value: 'Ramesh' },
      });
      fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
        target: { value: '' },
      });
      fireEvent.click(screen.getByLabelText('Select Patient 01'));
      fireEvent.click(within(header('Name')).getByRole('button'));
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });
});

// Tokens only: the checkbox column is the box plus the row padding on both sides, one token that
// the pinned first column starts at too.
describe('DataTable tokens', () => {
  it('sizes the select column and its box from the table tokens', () => {
    renderTable({ selectable: true });
    const select = bodyRows()[0]?.querySelector('td') as HTMLElement;
    expect([...select.classList]).toEqual(
      expect.arrayContaining(['w-table-select', 'min-w-table-select']),
    );
    const box = select.querySelector('input') as HTMLElement;
    expect([...box.classList]).toEqual(
      expect.arrayContaining(['size-table-check', 'rounded-control']),
    );
  });
});
