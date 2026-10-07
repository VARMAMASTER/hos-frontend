import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EmptyState } from './empty-state';

afterEach(() => cleanup());

describe('EmptyState', () => {
  it('renders its title, description and action', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No lab results yet"
        description="Results appear here as soon as the lab files them."
        action={
          <button type="button" onClick={onClick}>
            Order a test
          </button>
        }
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'No lab results yet' }),
    ).toBeTruthy();
    expect(
      screen.getByText('Results appear here as soon as the lab files them.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Order a test' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('titles itself at heading level 3 unless told otherwise', () => {
    const { rerender } = render(<EmptyState title="Nothing here" />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Nothing here' }),
    ).toBeTruthy();
    rerender(<EmptyState title="Nothing here" headingLevel={2} />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Nothing here' }),
    ).toBeTruthy();
  });

  it('renders only the title when nothing else is given', () => {
    const { container } = render(<EmptyState title="Nothing here" />);
    expect(container.querySelector('p')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('treats the icon as decoration, since the title already says what is missing', () => {
    render(
      <EmptyState title="Nothing here" icon={<svg data-testid="icon" />} />,
    );
    expect(
      screen.getByTestId('icon').closest('[aria-hidden="true"]'),
    ).not.toBeNull();
  });

  it('is a centred, muted panel', () => {
    const { container } = render(
      <EmptyState title="Nothing here" description="Try another filter." />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('text-center')).toBe(true);
    expect(root.classList.contains('rounded-card')).toBe(true);
    expect(
      screen.getByText('Try another filter.').classList.contains('text-ink-2'),
    ).toBe(true);
  });

  it('passes extra attributes to the panel, such as role="status" for live results', () => {
    render(<EmptyState title="No matches" role="status" />);
    expect(screen.getByRole('status')).toBeTruthy();
  });
});

describe('EmptyState, in the prototype vocabulary', () => {
  it('centres a 40px icon, the prototype h2 (17px semibold) and a 13px line capped at 320px, padded 48', () => {
    render(
      <EmptyState
        title="No beds free"
        description="Ramesh is first on the waitlist."
        icon={<svg data-testid="icon" />}
      />,
    );
    const heading = screen.getByRole('heading', { name: 'No beds free' });
    expect([...heading.classList]).toEqual(
      expect.arrayContaining(['text-title', 'font-semibold']),
    );
    const body = screen.getByText('Ramesh is first on the waitlist.');
    expect([...body.classList]).toEqual(
      expect.arrayContaining(['text-control', 'max-w-xs']),
    );
    const root = heading.parentElement as HTMLElement;
    expect([...root.classList]).toEqual(
      expect.arrayContaining(['py-s10', 'items-center', 'text-center']),
    );
    const icon = screen.getByTestId('icon').parentElement as HTMLElement;
    expect(icon.classList).toContain('[&_svg]:size-empty-icon');
  });
});
