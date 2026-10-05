import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TopBar } from './top-bar';

afterEach(() => cleanup());

function precedes(first: Element, second: Element): boolean {
  return Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

describe('TopBar', () => {
  it('is the dark app chrome, pinned above the page as it scrolls', () => {
    const { container } = render(<TopBar />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset['surface']).toBe('chrome');
    expect(root.tagName).toBe('HEADER');
    for (const name of [
      'nova-chrome',
      'rounded-none',
      'sticky',
      'top-0',
      'z-20',
      'flex',
    ]) {
      expect(root.classList.contains(name), name).toBe(true);
    }
  });

  it('renders the search slot inside a search landmark', () => {
    render(<TopBar search={<input aria-label="Find a patient" />} />);
    const landmark = screen.getByRole('search');
    expect(landmark.contains(screen.getByLabelText('Find a patient'))).toBe(
      true,
    );
  });

  it('lets the search slot flex up to a bounded width', () => {
    render(<TopBar search={<input aria-label="Find a patient" />} />);
    const landmark = screen.getByRole('search');
    expect(landmark.classList.contains('flex-1')).toBe(true);
    expect(landmark.classList.contains('max-w-lg')).toBe(true);
    // Without min-w-0 a long placeholder would keep the slot from shrinking on a narrow screen.
    expect(landmark.classList.contains('min-w-0')).toBe(true);
  });

  it('renders the actions slot at the end of the row', () => {
    render(<TopBar actions={<button type="button">New admission</button>} />);
    const button = screen.getByRole('button', { name: 'New admission' });
    const cluster = button.parentElement as HTMLElement;
    expect(cluster.classList.contains('ml-auto')).toBe(true);
    expect(cluster.classList.contains('shrink-0')).toBe(true);
  });

  it('renders children between the search and the actions', () => {
    render(
      <TopBar
        search={<input aria-label="Find a patient" />}
        actions={<button type="button">New admission</button>}
      >
        <p>Ward 4B</p>
      </TopBar>,
    );
    const search = screen.getByRole('search');
    const middle = screen.getByText('Ward 4B');
    const actions = screen.getByRole('button', { name: 'New admission' });
    expect(precedes(search, middle)).toBe(true);
    expect(precedes(middle, actions)).toBe(true);
  });

  it('renders no search landmark and no empty wrappers when the slots are omitted', () => {
    const { container } = render(<TopBar />);
    expect(screen.queryByRole('search')).toBeNull();
    expect((container.firstElementChild as HTMLElement).children).toHaveLength(
      0,
    );
  });

  it('merges a caller className and passes other attributes to the root', () => {
    const { container } = render(
      <TopBar className="extra" aria-label="Page header" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('extra')).toBe(true);
    expect(root.classList.contains('nova-chrome')).toBe(true);
    expect(root.getAttribute('aria-label')).toBe('Page header');
  });
});
