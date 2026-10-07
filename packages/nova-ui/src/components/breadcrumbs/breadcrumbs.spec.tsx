import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Breadcrumbs } from './breadcrumbs';

afterEach(() => cleanup());

const trail = [
  { label: 'Patients', href: '/patients' },
  { label: 'Asha Rao', href: '/patients/42' },
  { label: 'Lab results' },
];

describe('Breadcrumbs', () => {
  it('is a labelled navigation landmark holding an ordered list in trail order', () => {
    render(<Breadcrumbs items={trail} />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const list = nav.querySelector('ol');
    expect(list).not.toBeNull();
    const labels = Array.from(list?.querySelectorAll('li') ?? []).map(
      (item) => item.firstElementChild?.textContent,
    );
    expect(labels).toEqual(['Patients', 'Asha Rao', 'Lab results']);
  });

  it('links the earlier items to their hrefs', () => {
    render(<Breadcrumbs items={trail} />);
    expect(
      screen.getByRole('link', { name: 'Patients' }).getAttribute('href'),
    ).toBe('/patients');
    expect(
      screen.getByRole('link', { name: 'Asha Rao' }).getAttribute('href'),
    ).toBe('/patients/42');
  });

  it('marks the last item as the current page and does not link it', () => {
    const { container } = render(<Breadcrumbs items={trail} />);
    const current = screen.getByText('Lab results');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.closest('a')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Lab results' })).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(container.querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  it('does not link the last item even when it has an href', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Patients', href: '/patients' },
          { label: 'Asha Rao', href: '/patients/42' },
        ]}
      />,
    );
    expect(screen.queryByRole('link', { name: 'Asha Rao' })).toBeNull();
    expect(screen.getByText('Asha Rao').getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it('shows an earlier item without an href as text, not a dead link', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Patients', href: '/patients' },
          { label: 'Ward 4B' },
          { label: 'Asha Rao' },
        ]}
      />,
    );
    const ward = screen.getByText('Ward 4B');
    expect(ward.closest('a')).toBeNull();
    expect(ward.getAttribute('aria-current')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('hides the separators from assistive technology', () => {
    const { container } = render(<Breadcrumbs items={trail} />);
    const separators = Array.from(
      container.querySelectorAll('li > [aria-hidden="true"]'),
    );
    expect(separators).toHaveLength(2);
    expect(separators.map((separator) => separator.textContent)).toEqual([
      '/',
      '/',
    ]);
  });

  it('has no separator on a single-item trail', () => {
    const { container } = render(<Breadcrumbs items={[{ label: 'Home' }]} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(screen.getByText('Home').getAttribute('aria-current')).toBe('page');
  });

  it('renders nothing for an empty trail', () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('lets the landmark label be translated', () => {
    render(<Breadcrumbs items={trail} aria-label="Fil d'Ariane" />);
    expect(
      screen.getByRole('navigation', { name: "Fil d'Ariane" }),
    ).toBeTruthy();
  });
});

// Tokens only: the .crumb-bar trail's type role, line height and gap, and the link's corner and
// underline offset.
describe('Breadcrumbs tokens', () => {
  it('sets the trail and its links from tokens', () => {
    render(<Breadcrumbs items={trail} />);
    const list = screen.getByRole('list');
    expect([...list.classList]).toEqual(
      expect.arrayContaining(['gap-s2', 'text-body-sm', 'leading-snug']),
    );
    const [link] = screen.getAllByRole('link');
    expect([...(link as HTMLElement).classList]).toEqual(
      expect.arrayContaining(['rounded-control', 'underline-offset-loose']),
    );
  });
});
