import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AppShell } from './app-shell';

afterEach(() => cleanup());

describe('AppShell', () => {
  it('renders the sidebar and the page content', () => {
    render(
      <AppShell sidebar={<p>Sidebar content</p>}>
        <p>Page content</p>
      </AppShell>,
    );
    expect(screen.getByText('Sidebar content')).toBeTruthy();
    expect(screen.getByText('Page content')).toBeTruthy();
  });

  it('puts the page content in the main landmark and keeps the sidebar out of it', () => {
    render(
      <AppShell sidebar={<p>Sidebar content</p>}>
        <p>Page content</p>
      </AppShell>,
    );
    const main = screen.getByRole('main');
    expect(main.contains(screen.getByText('Page content'))).toBe(true);
    expect(main.contains(screen.getByText('Sidebar content'))).toBe(false);
  });

  it('paints the main column on the brand canvas so glass has something to frost', () => {
    render(
      <AppShell sidebar={<p>Sidebar content</p>}>
        <p>Page content</p>
      </AppShell>,
    );
    expect(screen.getByRole('main').classList.contains('nova-canvas')).toBe(
      true,
    );
  });

  it('lets the main column shrink, so a wide table cannot stretch the whole grid', () => {
    render(
      <AppShell sidebar={<p>Sidebar content</p>}>
        <p>Page content</p>
      </AppShell>,
    );
    expect(screen.getByRole('main').classList.contains('min-w-0')).toBe(true);
  });

  it('puts the sidebar before the content, so it stacks above it on small screens', () => {
    render(
      <AppShell sidebar={<p>Sidebar content</p>}>
        <p>Page content</p>
      </AppShell>,
    );
    const sidebar = screen.getByText('Sidebar content');
    const main = screen.getByRole('main');
    expect(
      sidebar.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('is a full-height grid: one column below md, sidebar then content from md up', () => {
    const { container } = render(
      <AppShell sidebar={<p>Sidebar content</p>}>
        <p>Page content</p>
      </AppShell>,
    );
    const root = container.firstElementChild as HTMLElement;
    for (const name of [
      'grid',
      'min-h-screen',
      'grid-cols-1',
      // The sidebar width is a variable that falls back to 248px, so a tenant can override it.
      'md:grid-cols-[var(--nova-sidebar-w,248px)_1fr]',
    ]) {
      expect(root.classList.contains(name), name).toBe(true);
    }
  });

  it('merges a caller className and passes other div attributes to the root', () => {
    const { container } = render(
      <AppShell
        sidebar={<p>Sidebar content</p>}
        className="extra"
        data-testid="shell"
      >
        <p>Page content</p>
      </AppShell>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('extra')).toBe(true);
    expect(root.classList.contains('grid')).toBe(true);
    expect(root.dataset['testid']).toBe('shell');
  });
});
