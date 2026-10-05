import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Pagination } from './pagination';

afterEach(() => cleanup());

const noop = () => undefined;

function button(name: string) {
  return screen.getByRole('button', { name }) as HTMLButtonElement;
}

function buttonLabels() {
  return screen.getAllByRole('button').map((element) => element.textContent);
}

describe('Pagination', () => {
  it('is a navigation landmark with an accessible label', () => {
    render(<Pagination page={1} pageCount={5} onPageChange={noop} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy();
  });

  it('takes a different label when a screen has more than one pager', () => {
    render(
      <Pagination
        page={1}
        pageCount={5}
        onPageChange={noop}
        aria-label="Lab results pages"
      />,
    );
    expect(
      screen.getByRole('navigation', { name: 'Lab results pages' }),
    ).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).toBeNull();
  });

  it.each([
    { page: 1, previousDisabled: true, nextDisabled: false },
    { page: 3, previousDisabled: false, nextDisabled: false },
    { page: 5, previousDisabled: false, nextDisabled: true },
  ])(
    'on page $page of 5, Previous disabled is $previousDisabled and Next disabled is $nextDisabled',
    ({ page, previousDisabled, nextDisabled }) => {
      render(<Pagination page={page} pageCount={5} onPageChange={noop} />);
      expect(button('Previous').disabled).toBe(previousDisabled);
      expect(button('Next').disabled).toBe(nextDisabled);
    },
  );

  it('asks for the neighbouring page when Previous or Next is pressed', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} pageCount={5} onPageChange={onPageChange} />);
    fireEvent.click(button('Next'));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
    fireEvent.click(button('Previous'));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    expect(onPageChange).toHaveBeenCalledTimes(2);
  });

  it('asks for the page that was pressed', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageCount={5} onPageChange={onPageChange} />);
    fireEvent.click(button('Page 4'));
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('never asks for a page outside the bounds, or for the page already shown', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(
      <Pagination page={1} pageCount={5} onPageChange={onPageChange} />,
    );
    fireEvent.click(button('Previous'));
    fireEvent.click(button('Page 1'));
    rerender(<Pagination page={5} pageCount={5} onPageChange={onPageChange} />);
    fireEvent.click(button('Next'));
    fireEvent.click(button('Page 5'));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('announces the current page with aria-current="page", and only that page', () => {
    const { container } = render(
      <Pagination page={3} pageCount={5} onPageChange={noop} />,
    );
    const current = container.querySelectorAll('[aria-current]');
    expect(current).toHaveLength(1);
    expect(current[0]).toBe(button('Page 3'));
    expect(current[0]?.getAttribute('aria-current')).toBe('page');
  });

  it('lists every page of a short range, with no ellipsis', () => {
    render(<Pagination page={3} pageCount={5} onPageChange={noop} />);
    expect(buttonLabels()).toEqual([
      'Previous',
      '1',
      '2',
      '3',
      '4',
      '5',
      'Next',
    ]);
    expect(screen.queryByText('…')).toBeNull();
  });

  it('windows a long range around the current page, with hidden ellipses', () => {
    const { container } = render(
      <Pagination page={10} pageCount={20} onPageChange={noop} />,
    );
    expect(buttonLabels()).toEqual([
      'Previous',
      '1',
      '9',
      '10',
      '11',
      '20',
      'Next',
    ]);
    const gaps = Array.from(container.querySelectorAll('[aria-hidden="true"]'));
    expect(gaps.map((gap) => gap.textContent)).toEqual(['…', '…']);
  });

  it('shows a lone skipped page rather than an ellipsis standing in for it', () => {
    render(<Pagination page={4} pageCount={7} onPageChange={noop} />);
    expect(buttonLabels()).toEqual([
      'Previous',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      'Next',
    ]);
    expect(screen.queryByText('…')).toBeNull();
  });

  it('treats a single page as the current page with nowhere to go', () => {
    render(<Pagination page={1} pageCount={1} onPageChange={noop} />);
    expect(button('Previous').disabled).toBe(true);
    expect(button('Next').disabled).toBe(true);
    expect(button('Page 1').getAttribute('aria-current')).toBe('page');
  });

  it.each([
    { page: 9, pageCount: 3, current: 'Page 3' },
    { page: 0, pageCount: 3, current: 'Page 1' },
    { page: 1, pageCount: 0, current: 'Page 1' },
  ])(
    'clamps page $page of $pageCount to $current',
    ({ page, pageCount, current }) => {
      render(
        <Pagination page={page} pageCount={pageCount} onPageChange={noop} />,
      );
      expect(button(current).getAttribute('aria-current')).toBe('page');
    },
  );
});
