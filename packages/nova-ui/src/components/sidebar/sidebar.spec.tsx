import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Sidebar } from './sidebar';

afterEach(() => cleanup());

describe('Sidebar', () => {
  it('is the dark app chrome', () => {
    const { container } = render(
      <Sidebar>
        <a href="/home">Home</a>
      </Sidebar>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('nova-chrome')).toBe(true);
    expect(root.dataset['surface']).toBe('chrome');
    // A frame, not a card: its edges are straight.
    expect(root.classList.contains('rounded-none')).toBe(true);
    expect(root.classList.contains('flex')).toBe(true);
    expect(root.classList.contains('flex-col')).toBe(true);
  });

  it('keeps the nav items inside a real, named nav landmark', () => {
    render(
      <Sidebar>
        <a href="/home">Home</a>
        <a href="/patients">Patients</a>
      </Sidebar>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav.tagName).toBe('NAV');
    expect(nav.contains(screen.getByRole('link', { name: 'Home' }))).toBe(true);
    expect(nav.contains(screen.getByRole('link', { name: 'Patients' }))).toBe(
      true,
    );
  });

  it('lets the caller name the navigation landmark', () => {
    render(
      <Sidebar navLabel="Clinical">
        <a href="/home">Home</a>
      </Sidebar>,
    );
    expect(screen.getByRole('navigation', { name: 'Clinical' })).toBeTruthy();
  });

  it('puts the brand above the nav and the footer below it, under a hairline rule', () => {
    render(
      <Sidebar brand={<p>Acme Hospital</p>} footer={<p>Dr. Rao</p>}>
        <a href="/home">Home</a>
      </Sidebar>,
    );
    const brand = screen.getByText('Acme Hospital');
    const nav = screen.getByRole('navigation');
    const footer = screen.getByText('Dr. Rao');
    expect(
      brand.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      nav.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // The footer's wrapper pins it to the bottom and carries the rule.
    const footerWrapper = footer.parentElement as HTMLElement;
    expect(footerWrapper.classList.contains('mt-auto')).toBe(true);
    expect(footerWrapper.classList.contains('border-t')).toBe(true);
  });

  it('renders no brand or footer wrapper when neither is given', () => {
    const { container } = render(
      <Sidebar>
        <a href="/home">Home</a>
      </Sidebar>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.children).toHaveLength(1);
    expect(root.firstElementChild?.tagName).toBe('NAV');
  });

  it('stays pinned full height from md up, scrolling on its own when the nav is long', () => {
    const { container } = render(
      <Sidebar>
        <a href="/home">Home</a>
      </Sidebar>,
    );
    const root = container.firstElementChild as HTMLElement;
    for (const name of [
      'md:sticky',
      'md:top-0',
      'md:h-screen',
      'md:overflow-y-auto',
    ]) {
      expect(root.classList.contains(name), name).toBe(true);
    }
  });

  it('merges a caller className and passes other div attributes to the root', () => {
    const { container } = render(
      <Sidebar className="extra" data-testid="side">
        <a href="/home">Home</a>
      </Sidebar>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('extra')).toBe(true);
    expect(root.classList.contains('nova-chrome')).toBe(true);
    expect(root.dataset['testid']).toBe('side');
  });
});
