import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  PAGE_SIZE_OPTIONS,
  PaginationBar,
  formatPaginationRange,
} from './pagination';

afterEach(() => cleanup());

describe('formatPaginationRange', () => {
  it.each([
    { page: 1, size: 25, total: 312, text: 'Showing 1–25 of 312' },
    { page: 2, size: 25, total: 312, text: 'Showing 26–50 of 312' },
    { page: 13, size: 25, total: 312, text: 'Showing 301–312 of 312' },
    { page: 1, size: 10, total: 4, text: 'Showing 1–4 of 4' },
    { page: 1, size: 10, total: 1, text: 'Showing 1 of 1' },
    { page: 1, size: 10, total: 0, text: 'Showing 0 of 0' },
  ])('page $page of $total at $size a page reads "$text"', (c) => {
    expect(formatPaginationRange(c.page, c.size, c.total)).toBe(c.text);
  });

  it('clamps a page past the end to the last page', () => {
    expect(formatPaginationRange(99, 25, 312)).toBe('Showing 301–312 of 312');
  });
});

describe('PaginationBar', () => {
  const noop = () => undefined;

  it('offers the page sizes 10, 25, 50 and 100', () => {
    expect(PAGE_SIZE_OPTIONS).toEqual([10, 25, 50, 100]);
  });

  it('shows the range label in a polite live region', () => {
    render(
      <PaginationBar
        page={1}
        pageSize={25}
        total={312}
        onPageChange={noop}
        onPageSizeChange={noop}
      />,
    );
    const label = screen.getByText('Showing 1–25 of 312');
    expect(label.getAttribute('aria-live')).toBe('polite');
  });

  it('has a Rows per page select with 10, 25, 50 and 100, set to the current size', () => {
    render(
      <PaginationBar
        page={1}
        pageSize={25}
        total={312}
        onPageChange={noop}
        onPageSizeChange={noop}
      />,
    );
    const select = screen.getByLabelText('Rows per page') as HTMLSelectElement;
    expect(Array.from(select.options).map((option) => option.value)).toEqual([
      '10',
      '25',
      '50',
      '100',
    ]);
    expect(select.value).toBe('25');
  });

  it('reports a new page size as a number', () => {
    const onPageSizeChange = vi.fn();
    render(
      <PaginationBar
        page={1}
        pageSize={25}
        total={312}
        onPageChange={noop}
        onPageSizeChange={onPageSizeChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Rows per page'), {
      target: { value: '50' },
    });
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it('keeps an unusual current size selectable instead of dropping it', () => {
    render(
      <PaginationBar
        page={1}
        pageSize={20}
        total={100}
        onPageChange={noop}
        onPageSizeChange={noop}
      />,
    );
    const select = screen.getByLabelText('Rows per page') as HTMLSelectElement;
    expect(select.value).toBe('20');
  });

  it('leaves the select out when there is no handler for it', () => {
    render(
      <PaginationBar page={1} pageSize={25} total={312} onPageChange={noop} />,
    );
    expect(screen.queryByLabelText('Rows per page')).toBeNull();
  });

  it('pages through the total: 312 rows at 25 a page is 13 pages', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationBar
        page={1}
        pageSize={25}
        total={312}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Page 13' }));
    expect(onPageChange).toHaveBeenCalledWith(13);
  });

  it('is one page, with nowhere to go, when there are no rows', () => {
    render(
      <PaginationBar page={1} pageSize={25} total={0} onPageChange={noop} />,
    );
    expect(
      (screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.getByText('Showing 0 of 0')).toBeTruthy();
  });
});
