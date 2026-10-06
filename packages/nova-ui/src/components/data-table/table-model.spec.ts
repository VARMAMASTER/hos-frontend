// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  compareValues,
  filterRows,
  nextSort,
  sortRows,
  visibleColumns,
} from './table-model';
import type { DataTableColumn } from './types';

interface Row {
  id: string;
  name: string | null;
  age: number | null;
  admitted: Date | string | null;
  ward: string;
}

const row = (
  id: string,
  name: string | null,
  age: number | null,
  admitted: Date | string | null = null,
  ward = 'A',
): Row => ({ id, name, age, admitted, ward });

const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Name', accessor: (r) => r.name, sortable: true },
  { id: 'age', header: 'Age', accessor: (r) => r.age, sortable: true },
  {
    id: 'admitted',
    header: 'Admitted',
    accessor: (r) => r.admitted,
    sortable: true,
  },
  { id: 'ward', header: 'Ward', accessor: (r) => r.ward },
];

const ids = (rows: readonly Row[]) => rows.map((r) => r.id);

describe('compareValues', () => {
  it('compares numbers by value, not as text', () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
    expect(compareValues(10, 2)).toBeGreaterThan(0);
    expect(compareValues(3, 3)).toBe(0);
  });

  it('compares text without regard to case, with digit runs as numbers', () => {
    expect(compareValues('apple', 'Banana')).toBeLessThan(0);
    expect(compareValues('Bed 9', 'Bed 10')).toBeLessThan(0);
    expect(compareValues('ward', 'WARD')).toBe(0);
  });

  it('compares dates by time, and a Date against an ISO string by time too', () => {
    expect(
      compareValues(new Date('2026-01-02'), new Date('2026-01-10')),
    ).toBeLessThan(0);
    expect(compareValues(new Date('2026-03-01'), '2026-02-01')).toBeGreaterThan(
      0,
    );
  });

  it('puts false before true', () => {
    expect(compareValues(false, true)).toBeLessThan(0);
  });
});

describe('sortRows', () => {
  const rows = [
    row('1', 'Meera', 41),
    row('2', 'ajay', 9),
    row('3', 'Zoya', 10),
  ];

  it('returns the rows as they came when there is no sort, or the column is unknown', () => {
    expect(ids(sortRows(rows, columns, null))).toEqual(['1', '2', '3']);
    expect(
      ids(sortRows(rows, columns, { columnId: 'nope', direction: 'asc' })),
    ).toEqual(['1', '2', '3']);
  });

  it('sorts text ascending and descending, ignoring case', () => {
    expect(
      ids(sortRows(rows, columns, { columnId: 'name', direction: 'asc' })),
    ).toEqual(['2', '1', '3']);
    expect(
      ids(sortRows(rows, columns, { columnId: 'name', direction: 'desc' })),
    ).toEqual(['3', '1', '2']);
  });

  it('sorts numbers by value', () => {
    expect(
      ids(sortRows(rows, columns, { columnId: 'age', direction: 'asc' })),
    ).toEqual(['2', '3', '1']);
  });

  it('sorts dates, whether Date objects or ISO strings', () => {
    const dated = [
      row('1', 'a', 1, new Date('2026-03-05')),
      row('2', 'b', 1, '2026-01-20'),
      row('3', 'c', 1, new Date('2026-02-11')),
    ];
    expect(
      ids(sortRows(dated, columns, { columnId: 'admitted', direction: 'asc' })),
    ).toEqual(['2', '3', '1']);
  });

  it('is stable: equal values keep their original order, either direction', () => {
    const tied = [
      row('1', 'x', 5),
      row('2', 'y', 5),
      row('3', 'z', 5),
      row('4', 'w', 1),
    ];
    expect(
      ids(sortRows(tied, columns, { columnId: 'age', direction: 'asc' })),
    ).toEqual(['4', '1', '2', '3']);
    expect(
      ids(sortRows(tied, columns, { columnId: 'age', direction: 'desc' })),
    ).toEqual(['1', '2', '3', '4']);
  });

  it('keeps empty values at the end whichever way it sorts', () => {
    const gappy = [row('1', null, null), row('2', 'b', 2), row('3', 'a', 1)];
    expect(
      ids(sortRows(gappy, columns, { columnId: 'age', direction: 'asc' })),
    ).toEqual(['3', '2', '1']);
    expect(
      ids(sortRows(gappy, columns, { columnId: 'age', direction: 'desc' })),
    ).toEqual(['2', '3', '1']);
  });

  it('uses a column compare function when it has one, and reverses it for descending', () => {
    const byLength: DataTableColumn<Row> = {
      id: 'len',
      header: 'Length',
      sortable: true,
      compare: (a, b) => (a.name ?? '').length - (b.name ?? '').length,
    };
    const sample = [row('1', 'ccc', 0), row('2', 'a', 0), row('3', 'bb', 0)];
    expect(
      ids(sortRows(sample, [byLength], { columnId: 'len', direction: 'asc' })),
    ).toEqual(['2', '3', '1']);
    expect(
      ids(sortRows(sample, [byLength], { columnId: 'len', direction: 'desc' })),
    ).toEqual(['1', '3', '2']);
  });

  it('does not touch the array it was given', () => {
    const copy = [...rows];
    sortRows(rows, columns, { columnId: 'name', direction: 'asc' });
    expect(rows).toEqual(copy);
  });
});

describe('nextSort', () => {
  it('cycles a column none, ascending, descending, none', () => {
    const asc = nextSort(null, 'age');
    expect(asc).toEqual({ columnId: 'age', direction: 'asc' });
    const desc = nextSort(asc, 'age');
    expect(desc).toEqual({ columnId: 'age', direction: 'desc' });
    expect(nextSort(desc, 'age')).toBeNull();
  });

  it('starts another column at ascending', () => {
    expect(nextSort({ columnId: 'age', direction: 'desc' }, 'name')).toEqual({
      columnId: 'name',
      direction: 'asc',
    });
  });
});

describe('filterRows', () => {
  const rows = [
    row('1', 'Ramesh Rao', 54, '2026-01-02', 'ICU'),
    row('2', 'Meera Nair', 41, '2026-02-03', 'General'),
    row('3', 'Ramya Iyer', 29, null, 'ICU'),
  ];

  it('keeps every row for an empty or blank query', () => {
    expect(filterRows(rows, columns, '')).toHaveLength(3);
    expect(filterRows(rows, columns, '   ')).toHaveLength(3);
  });

  it('matches case-insensitively across every column', () => {
    expect(ids(filterRows(rows, columns, 'icu'))).toEqual(['1', '3']);
    expect(ids(filterRows(rows, columns, 'NAIR'))).toEqual(['2']);
    expect(ids(filterRows(rows, columns, '41'))).toEqual(['2']);
  });

  it('needs every word to match somewhere in the row', () => {
    expect(ids(filterRows(rows, columns, 'ram icu'))).toEqual(['1', '3']);
    expect(ids(filterRows(rows, columns, 'ramesh general'))).toEqual([]);
  });

  it('honours searchValue, and leaves out columns with searchValue false', () => {
    const custom: DataTableColumn<Row>[] = [
      { id: 'name', header: 'Name', accessor: (r) => r.name },
      {
        id: 'ward',
        header: 'Ward',
        accessor: (r) => r.ward,
        searchValue: false,
      },
      {
        id: 'tag',
        header: 'Tag',
        searchValue: (r) => `tag-${r.id}`,
      },
    ];
    expect(ids(filterRows(rows, custom, 'icu'))).toEqual([]);
    expect(ids(filterRows(rows, custom, 'tag-2'))).toEqual(['2']);
  });
});

describe('visibleColumns', () => {
  it('drops hidden columns that are hideable and never a column that is not', () => {
    const cols: DataTableColumn<Row>[] = [
      { id: 'a', header: 'A' },
      { id: 'b', header: 'B', hideable: true },
      { id: 'c', header: 'C' },
    ];
    expect(visibleColumns(cols, ['b', 'c']).map((c) => c.id)).toEqual([
      'a',
      'c',
    ]);
  });
});
