import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from './table';

afterEach(() => cleanup());

function renderResults(caption = 'Lab results, 14 Oct') {
  return render(
    <Table caption={caption}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Test</TableHeaderCell>
          <TableHeaderCell numeric>Result (g/dL)</TableHeaderCell>
          <TableHeaderCell align="center">Flag</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableHeaderCell scope="row">Haemoglobin</TableHeaderCell>
          <TableCell numeric>13.4</TableCell>
          <TableCell align="center">Normal</TableCell>
        </TableRow>
        <TableRow>
          <TableHeaderCell scope="row">Ferritin</TableHeaderCell>
          <TableCell numeric>8</TableCell>
          <TableCell align="center">Low</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
}

describe('Table', () => {
  it('is a semantic table named by its caption', () => {
    renderResults();
    const table = screen.getByRole('table', { name: 'Lab results, 14 Oct' });
    expect(table.tagName).toBe('TABLE');
    expect(table.querySelector('caption')?.textContent).toBe(
      'Lab results, 14 Oct',
    );
  });

  it('renders column headers as <th scope="col"> in the head', () => {
    const { container } = renderResults();
    const headers = Array.from(container.querySelectorAll('thead th'));
    expect(headers.map((header) => header.textContent)).toEqual([
      'Test',
      'Result (g/dL)',
      'Flag',
    ]);
    for (const header of headers) {
      expect(header.tagName).toBe('TH');
      expect(header.getAttribute('scope')).toBe('col');
    }
  });

  it('lets a header cell label a row with scope="row"', () => {
    renderResults();
    const rowHeader = screen.getByText('Haemoglobin');
    expect(rowHeader.tagName).toBe('TH');
    expect(rowHeader.getAttribute('scope')).toBe('row');
  });

  it('styles a row header as body text, and a column header as a small caption', () => {
    renderResults();
    const column = screen.getByText('Test');
    const row = screen.getByText('Haemoglobin');
    expect(column.classList.contains('text-meta')).toBe(true);
    expect(row.classList.contains('text-meta')).toBe(false);
    expect(row.classList.contains('font-semibold')).toBe(true);
  });

  it('passes native header attributes through, such as aria-sort', () => {
    render(
      <Table caption="Sortable">
        <TableHead>
          <TableRow>
            <TableHeaderCell aria-sort="ascending" colSpan={2}>
              Name
            </TableHeaderCell>
          </TableRow>
        </TableHead>
      </Table>,
    );
    const header = screen.getByText('Name');
    expect(header.getAttribute('aria-sort')).toBe('ascending');
    expect(header.getAttribute('colspan')).toBe('2');
  });

  it('sets numeric columns in tabular numerals, right-aligned, so digits line up', () => {
    renderResults();
    for (const cell of [
      screen.getByText('Result (g/dL)'),
      screen.getByText('13.4'),
      screen.getByText('8'),
    ]) {
      expect(cell.classList.contains('tabular-nums')).toBe(true);
      expect(cell.classList.contains('text-right')).toBe(true);
    }
  });

  it('leaves text columns in proportional numerals, left-aligned by default', () => {
    renderResults();
    for (const cell of [
      screen.getByText('Test'),
      screen.getByText('Ferritin'),
    ]) {
      expect(cell.classList.contains('tabular-nums')).toBe(false);
      expect(cell.classList.contains('text-left')).toBe(true);
    }
  });

  it('honours an explicit align, which wins over the numeric default', () => {
    render(
      <Table caption="Alignment">
        <TableBody>
          <TableRow>
            <TableCell align="center">centred</TableCell>
            <TableCell align="right">right</TableCell>
            <TableCell numeric align="left">
              left-numeric
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText('centred').classList.contains('text-center')).toBe(
      true,
    );
    expect(screen.getByText('right').classList.contains('text-right')).toBe(
      true,
    );
    const leftNumeric = screen.getByText('left-numeric');
    expect(leftNumeric.classList.contains('text-left')).toBe(true);
    expect(leftNumeric.classList.contains('text-right')).toBe(false);
    expect(leftNumeric.classList.contains('tabular-nums')).toBe(true);
  });

  it('keeps wide tables inside a horizontal scroll container', () => {
    const { container } = renderResults();
    const frame = container.firstElementChild as HTMLElement;
    const scroller = frame.firstElementChild as HTMLElement;
    expect(scroller.classList.contains('overflow-x-auto')).toBe(true);
    expect(scroller.firstElementChild?.tagName).toBe('TABLE');
    expect(frame.classList.contains('rounded-card')).toBe(true);
  });

  it('does not scroll the frame itself, so the data material rim stays put', () => {
    const { container } = renderResults();
    const frame = container.firstElementChild as HTMLElement;
    expect(frame.className).not.toMatch(/overflow-/);
    expect(frame.dataset['surface']).toBe('data');
  });

  it('makes the scroll container keyboard-reachable and named by the caption', () => {
    renderResults();
    const region = screen.getByRole('region', { name: 'Lab results, 14 Oct' });
    expect(region.getAttribute('tabindex')).toBe('0');
  });

  it('stays opaque under both materials: dense data never sits on glass', () => {
    const { container } = renderResults();
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('nova-data')).toBe(true);
    const everyClass = [root, ...Array.from(root.querySelectorAll('*'))]
      .map((element) => element.getAttribute('class') ?? '')
      .join(' ');
    expect(everyClass).not.toMatch(
      /nova-(surface|overlay|field|chrome|hero)|backdrop-|\bbg-[^\s/]+\/\d/,
    );
  });

  it('puts className on the frame and other attributes on the <table>', () => {
    const { container } = render(
      <Table
        caption="Attributes"
        className="mt-4"
        id="results"
        aria-describedby="note"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('mt-4')).toBe(true);
    const table = screen.getByRole('table', { name: 'Attributes' });
    expect(table.id).toBe('results');
    expect(table.getAttribute('aria-describedby')).toBe('note');
    expect(root.id).toBe('');
  });

  it('gives every table its own caption-linked region', () => {
    render(
      <>
        <Table caption="Vitals" />
        <Table caption="Medications" />
      </>,
    );
    expect(screen.getByRole('region', { name: 'Vitals' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Medications' })).toBeTruthy();
  });
});

describe('Table, for data that scrolls', () => {
  it('scrolls both ways inside its frame when it is given a max height', () => {
    const { container } = render(<Table caption="Long" maxHeight="20rem" />);
    const scroller = screen.getByRole('region', { name: 'Long' });
    expect(scroller.style.maxHeight).toBe('20rem');
    expect(scroller.classList.contains('overflow-auto')).toBe(true);
    expect(container.firstElementChild?.className).not.toMatch(/overflow-/);
  });

  it('takes a numeric max height as pixels', () => {
    render(<Table caption="Long" maxHeight={240} />);
    expect(screen.getByRole('region', { name: 'Long' }).style.maxHeight).toBe(
      '240px',
    );
  });

  it('keeps header cells in place while the body scrolls, on an opaque fill', () => {
    render(
      <Table caption="Sticky">
        <TableHead sticky>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
          </TableRow>
        </TableHead>
      </Table>,
    );
    const th = screen.getByText('Name');
    expect(th.classList.contains('sticky')).toBe(true);
    expect(th.classList.contains('top-0')).toBe(true);
    expect(th.classList.contains('z-20')).toBe(true);
    expect(th.classList.contains('bg-surface-2')).toBe(true);
    expect(th.className).not.toMatch(/bg-[^\s/]+\/\d/);
  });

  it('does not stick the head unless asked', () => {
    const { container } = renderResults();
    expect(screen.getByText('Test').classList.contains('sticky')).toBe(false);
    expect(container.querySelector('thead')?.className).not.toContain('sticky');
  });

  it('pins a cell to the start edge with sticky, over an opaque fill that follows the row', () => {
    render(
      <Table caption="Pinned">
        <TableBody>
          <TableRow>
            <TableCell stickyStart>pinned</TableCell>
            <TableCell>loose</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const pinned = screen.getByText('pinned');
    expect(pinned.classList.contains('sticky')).toBe(true);
    expect(pinned.classList.contains('bg-surface')).toBe(true);
    expect(pinned.className).toContain('group-hover:bg-primary-ghost');
    expect(screen.getByText('loose').classList.contains('sticky')).toBe(false);
  });

  it('puts a pinned header cell above the pinned body cells it scrolls over', () => {
    render(
      <Table caption="Pinned">
        <TableHead sticky>
          <TableRow>
            <TableHeaderCell stickyStart>Name</TableHeaderCell>
            <TableHeaderCell>Ward</TableHeaderCell>
          </TableRow>
        </TableHead>
      </Table>,
    );
    expect(screen.getByText('Name').classList.contains('z-30')).toBe(true);
  });

  it('marks a selected row with aria-selected and a tint', () => {
    render(
      <Table caption="Rows">
        <TableBody>
          <TableRow selected>
            <TableCell>chosen</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>other</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const chosen = screen.getByText('chosen').closest('tr') as HTMLElement;
    expect(chosen.getAttribute('aria-selected')).toBe('true');
    expect(chosen.classList.contains('bg-primary-soft')).toBe(true);
    const other = screen.getByText('other').closest('tr') as HTMLElement;
    expect(other.getAttribute('aria-selected')).toBeNull();
  });

  it('tightens every cell under density="compact"', () => {
    render(
      <Table caption="Dense" density="compact">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Ramesh</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    for (const text of ['Name', 'Ramesh']) {
      const cell = screen.getByText(text);
      expect(cell.classList.contains('py-row-compact')).toBe(true);
      expect(cell.classList.contains('py-row-comfortable')).toBe(false);
    }
  });

  it('is comfortable, the prototype padding, by default', () => {
    renderResults();
    expect(
      screen.getByText('Ferritin').classList.contains('py-row-comfortable'),
    ).toBe(true);
  });

  it('sets a mono cell in IBM Plex Mono', () => {
    render(
      <Table caption="Ids">
        <TableBody>
          <TableRow>
            <TableCell mono>MRN-0042</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText('MRN-0042').classList.contains('font-mono')).toBe(
      true,
    );
  });
});
