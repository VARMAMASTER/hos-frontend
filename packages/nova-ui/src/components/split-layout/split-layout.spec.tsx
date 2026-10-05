import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SplitLayout } from './split-layout';

afterEach(() => cleanup());

function root(): HTMLElement {
  return screen.getByTestId('split');
}

describe('SplitLayout', () => {
  it('renders both regions', () => {
    render(
      <SplitLayout
        data-testid="split"
        primary={<p>Beds</p>}
        secondary={<p>Feed</p>}
      />,
    );
    expect(screen.getByText('Beds')).toBeTruthy();
    expect(screen.getByText('Feed')).toBeTruthy();
  });

  it('puts the primary region first by default', () => {
    render(
      <SplitLayout
        data-testid="split"
        primary={<p>Beds</p>}
        secondary={<p>Feed</p>}
      />,
    );
    const regions = [...root().children].map((c) =>
      c.getAttribute('data-region'),
    );
    expect(regions).toEqual(['primary', 'secondary']);
  });

  it('defaults to an even split', () => {
    render(<SplitLayout data-testid="split" primary="a" secondary="b" />);
    expect(root().classList.contains('md:grid-cols-2')).toBe(true);
  });

  it.each([
    ['1-1', 'md:grid-cols-2'],
    ['2-1', 'md:grid-cols-[2fr_1fr]'],
    ['3-2', 'md:grid-cols-[3fr_2fr]'],
  ] as const)('maps the %s ratio to %s', (ratio, expected) => {
    render(
      <SplitLayout
        data-testid="split"
        ratio={ratio}
        primary="a"
        secondary="b"
      />,
    );
    expect(root().classList.contains(expected)).toBe(true);
  });

  it('is one column below the md breakpoint: every multi-column class is md-prefixed', () => {
    render(
      <SplitLayout data-testid="split" ratio="2-1" primary="a" secondary="b" />,
    );
    const columns = [...root().classList].filter((c) => /grid-cols-/.test(c));
    expect(columns).toContain('grid-cols-1');
    for (const cls of columns) {
      expect(cls === 'grid-cols-1' || cls.startsWith('md:')).toBe(true);
    }
  });

  it('lets both regions shrink, so a wide table cannot push the page wider', () => {
    render(<SplitLayout data-testid="split" primary="a" secondary="b" />);
    for (const region of root().children) {
      expect(region.classList.contains('min-w-0')).toBe(true);
    }
  });

  it('puts the secondary region first, in reading order too, when asked', () => {
    render(
      <SplitLayout
        data-testid="split"
        secondaryFirst
        primary={<p>Beds</p>}
        secondary={<p>Feed</p>}
      />,
    );
    const regions = [...root().children].map((c) =>
      c.getAttribute('data-region'),
    );
    expect(regions).toEqual(['secondary', 'primary']);
  });

  it('keeps the wider column on the primary region when the order is swapped', () => {
    render(
      <SplitLayout
        data-testid="split"
        secondaryFirst
        ratio="2-1"
        primary="a"
        secondary="b"
      />,
    );
    expect(root().classList.contains('md:grid-cols-[1fr_2fr]')).toBe(true);
    expect(root().classList.contains('md:grid-cols-[2fr_1fr]')).toBe(false);
  });

  it('merges a caller className', () => {
    render(
      <SplitLayout
        data-testid="split"
        className="mt-6"
        primary="a"
        secondary="b"
      />,
    );
    expect(root().classList.contains('mt-6')).toBe(true);
  });
});
