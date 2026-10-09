// The one AI mark: the Care spark, bare or in the AI tile, always beside a text label.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AiMark, CARE_SPARK_PATHS } from './ai-mark';
import { SparkleCluster } from './ai-sparkle';

afterEach(() => cleanup());

describe('AiMark', () => {
  it('draws the Care spark: a four-point spark with a cross cut out of its heart, and one twinkle', () => {
    const { container } = render(<AiMark />);
    const svg = container.querySelector('svg[data-ai-mark]');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.getAttribute('fill')).toBe('currentColor');
    const paths = [...(svg?.querySelectorAll('path') ?? [])];
    expect(paths.map((path) => path.getAttribute('d'))).toEqual([
      'M11 0.8Q12.9 9.1 21.2 11Q12.9 12.9 11 21.2Q9.1 12.9 0.8 11Q9.1 9.1 11 0.8ZM10.15 8.4h1.7v1.75h1.75v1.7h-1.75v1.75h-1.7v-1.75H8.4v-1.7h1.75Z',
      'M19.4 14.6q.55 2.85 3.4 3.4-2.85.55-3.4 3.4-.55-2.85-3.4-3.4 2.85-.55 3.4-3.4Z',
    ]);
    // The cross is a hole in the spark (evenodd), not a second shape laid on it.
    expect(paths[0]?.getAttribute('fill-rule')).toBe('evenodd');
    expect(CARE_SPARK_PATHS).toHaveLength(2);
  });

  it('is decoration: hidden from assistive technology and never focusable', () => {
    const { container } = render(<AiMark />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg?.querySelector('title')).toBeNull();
  });

  it('takes the shared extended size vocabulary, small by default', () => {
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      const { container } = render(<AiMark size={size} />);
      expect(container.querySelector('svg')?.getAttribute('class')).toContain(
        `size-icon-${size}`,
      );
      cleanup();
    }
    const { container } = render(<AiMark />);
    expect(container.querySelector('svg')?.getAttribute('class')).toContain(
      'size-icon-sm',
    );
  });

  it('is in the colour of its text, and takes a className last', () => {
    const { container } = render(<AiMark className="text-ai" />);
    const cls = container.querySelector('svg')?.getAttribute('class') ?? '';
    expect(cls).toContain('text-ai');
    expect(cls).toContain('shrink-0');
  });

  it('in the tile: the same glyph inside the AI tile, one aria-hidden element', () => {
    const { container } = render(<AiMark tile />);
    const tile = container.querySelector('.nova-ai-spark');
    expect(tile).not.toBeNull();
    expect(tile?.getAttribute('aria-hidden')).toBe('true');
    expect(tile?.querySelectorAll('svg[data-ai-mark]')).toHaveLength(1);
    // The tile owns its glyph's size, so a size prop is not drawn on the svg.
    expect(
      tile?.querySelector('svg')?.getAttribute('class') ?? '',
    ).not.toContain('size-icon');
    // Bare, there is no tile.
    cleanup();
    const bare = render(<AiMark />);
    expect(bare.container.querySelector('.nova-ai-spark')).toBeNull();
  });

  it('puts the className on the tile when tiled', () => {
    const { container } = render(<AiMark tile className="mt-s0" />);
    expect(container.querySelector('.nova-ai-spark')?.className).toContain(
      'mt-s0',
    );
  });

  it('the tile can hold a meaning of its own instead of the glyph (the approved check, a money gate)', () => {
    const { container } = render(<AiMark tile symbol="₹" />);
    const tile = container.querySelector('.nova-ai-spark');
    expect(tile?.textContent).toBe('₹');
    expect(tile?.querySelector('[data-ai-mark]')).toBeNull();
  });

  it('passes data attributes through to the tile', () => {
    const { container } = render(<AiMark tile data-spark="" />);
    expect(
      container.querySelector('.nova-ai-spark')?.hasAttribute('data-spark'),
    ).toBe(true);
  });
});

describe('SparkleCluster (deprecated)', () => {
  it('is the AiMark: same glyph, same sizes', () => {
    const { container } = render(<SparkleCluster size="md" />);
    const svg = container.querySelector('svg');
    expect(svg?.hasAttribute('data-ai-mark')).toBe(true);
    expect(svg?.hasAttribute('data-sparkle-cluster')).toBe(false);
    expect(svg?.getAttribute('class')).toContain('size-icon-md');
  });
});
