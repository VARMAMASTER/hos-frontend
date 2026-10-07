import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BrandMark } from './brand-mark';

afterEach(() => cleanup());

describe('BrandMark', () => {
  it('renders the product name and its sub-line', () => {
    render(<BrandMark name="HOS" sub="Hospital OS" />);
    expect(screen.getByText('HOS')).toBeTruthy();
    expect(screen.getByText('Hospital OS')).toBeTruthy();
  });

  it('renders the sub-line only when there is one', () => {
    render(<BrandMark name="HOS" />);
    expect(screen.queryByText('Hospital OS')).toBeNull();
  });

  it('shows the initials of a multi-word name when there is no logo', () => {
    render(<BrandMark name="Sri Venkateshwara Hospital" />);
    expect(screen.getByText('SV')).toBeTruthy();
  });

  it('shows the first two letters of a one-word name', () => {
    render(<BrandMark name="Apollo" />);
    expect(screen.getByText('AP')).toBeTruthy();
  });

  it('keeps a letter and its combining accent together in the initials', () => {
    render(<BrandMark name={'École Care'} />);
    expect(screen.getByText('ÉC')).toBeTruthy();
  });

  it('replaces the initials with a logo', () => {
    render(
      <BrandMark
        name="Sri Venkateshwara Hospital"
        logo={<img data-testid="logo" src="/logo.svg" alt="" />}
      />,
    );
    expect(screen.getByTestId('logo')).toBeTruthy();
    expect(screen.queryByText('SV')).toBeNull();
  });

  it('keeps the mark out of the accessible name, so a logo with alt text is not read twice', () => {
    render(
      <BrandMark
        name="HOS"
        href="/"
        logo={<img src="/logo.svg" alt="HOS logo" />}
      />,
    );
    expect(screen.getByRole('link', { name: 'HOS' })).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('is a link named by the product name when it has an href', () => {
    render(<BrandMark name="HOS" sub="Hospital OS" href="/home" />);
    const link = screen.getByRole('link', { name: 'HOS' });
    expect(link.getAttribute('href')).toBe('/home');
  });

  it('describes the link with the sub-line instead of folding it into the name', () => {
    render(<BrandMark name="HOS" sub="Hospital OS" href="/home" />);
    const link = screen.getByRole('link', { name: 'HOS' });
    const describedBy = link.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? '')?.textContent).toBe(
      'Hospital OS',
    );
  });

  it('is a heading with the product name, and not a link, when it has no href', () => {
    render(<BrandMark name="HOS" sub="Hospital OS" />);
    expect(screen.queryByRole('link')).toBeNull();
    const heading = screen.getByRole('heading', { name: 'HOS', level: 2 });
    expect(heading.textContent).toBe('HOS');
  });

  it('keeps the sub-line out of the heading', () => {
    render(<BrandMark name="HOS" sub="Hospital OS" />);
    expect(screen.queryByRole('heading', { name: /Hospital OS/ })).toBeNull();
  });

  it('lets the heading level fit the page', () => {
    render(<BrandMark name="HOS" headingLevel={1} />);
    expect(screen.getByRole('heading', { level: 1, name: 'HOS' })).toBeTruthy();
  });

  it('hides the initials from assistive technology', () => {
    render(<BrandMark name="Sri Venkateshwara Hospital" />);
    expect(screen.getByText('SV').getAttribute('aria-hidden')).toBe('true');
  });

  it('puts the sub-line in the chrome secondary ink', () => {
    render(<BrandMark name="HOS" sub="Hospital OS" />);
    expect(
      screen
        .getByText('Hospital OS')
        .classList.contains('text-(color:--nova-chrome-ink-2)'),
    ).toBe(true);
  });
});

// Tokens only: the 36px chrome tile with the card corner, the name and the sub line in their type
// roles.
describe('BrandMark tokens', () => {
  it('sizes the mark and sets the name and the sub line from tokens', () => {
    const { container } = render(<BrandMark name="Apollo" sub="Hospital OS" />);
    const mark = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect([...mark.classList]).toEqual(
      expect.arrayContaining(['size-chrome-tile', 'rounded-card', 'text-body']),
    );
    expect([...screen.getByText('Apollo').classList]).toContain(
      'text-subtitle',
    );
    expect([...screen.getByText('Hospital OS').classList]).toEqual(
      expect.arrayContaining(['text-meta', 'leading-tight']),
    );
  });
});
