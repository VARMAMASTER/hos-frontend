import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../theme/contrast';
import { NOVA_DEFAULTS } from '../../tokens/semantic';
import {
  NOVA_CHART_PALETTE,
  NOVA_CHART_SLOTS,
  resolveChartColor,
} from './palette';

// Euclidean distance in OKLab, times 100: the metric the dataviz validator uses.
function oklab(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function deltaE(a: string, b: string): number {
  const x = oklab(a);
  const y = oklab(b);
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

// Every colour a series could be mistaken for: the four statuses (and their deep inks), the brand
// and the AI family.
const RESERVED = Object.entries(NOVA_DEFAULTS).filter(([name]) =>
  /^--nova-color-(good|warn|crit|info|primary|ai)(-strong|-deep)?$/.test(name),
);

describe('NOVA_CHART_PALETTE', () => {
  it('has six series colours, one per slot', () => {
    expect(NOVA_CHART_PALETTE).toHaveLength(6);
    expect(NOVA_CHART_SLOTS).toEqual([
      'chart-1',
      'chart-2',
      'chart-3',
      'chart-4',
      'chart-5',
      'chart-6',
    ]);
  });

  it('is six distinct 6-digit hex colours', () => {
    for (const colour of NOVA_CHART_PALETTE) {
      expect(colour).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(new Set(NOVA_CHART_PALETTE).size).toBe(6);
  });

  it('never equals a status, brand or AI colour', () => {
    expect(RESERVED.length).toBeGreaterThanOrEqual(12);
    const reserved = RESERVED.map(([, value]) => String(value).toUpperCase());
    for (const colour of NOVA_CHART_PALETTE) {
      expect(reserved).not.toContain(colour);
    }
  });

  it('keeps a visible distance from every status, brand and AI colour, not only a different hex', () => {
    for (const colour of NOVA_CHART_PALETTE) {
      for (const [name, value] of RESERVED) {
        expect(
          deltaE(colour, String(value)),
          `${colour} against ${name}`,
        ).toBeGreaterThanOrEqual(10);
      }
    }
  });

  it('clears 3:1 against white, so a thin line or a small mark stays legible', () => {
    for (const colour of NOVA_CHART_PALETTE) {
      expect(
        contrastRatio(colour, NOVA_DEFAULTS['--nova-color-surface']),
        colour,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps neighbouring slots easy to tell apart', () => {
    for (let i = 0; i < NOVA_CHART_PALETTE.length - 1; i += 1) {
      expect(
        deltaE(NOVA_CHART_PALETTE[i], NOVA_CHART_PALETTE[i + 1]),
      ).toBeGreaterThanOrEqual(15);
    }
  });

  it('is fixed: frozen, and not one of the tokens a hospital theme can override', () => {
    expect(Object.isFrozen(NOVA_CHART_PALETTE)).toBe(true);
    expect(
      Object.keys(NOVA_DEFAULTS).filter((name) => /chart/.test(name)),
    ).toEqual([]);
  });
});

describe('resolveChartColor', () => {
  it('resolves a palette slot to its colour', () => {
    expect(resolveChartColor('chart-1', 0)).toBe(NOVA_CHART_PALETTE[0]);
    expect(resolveChartColor('chart-6', 0)).toBe(NOVA_CHART_PALETTE[5]);
  });

  it('passes any other colour through untouched', () => {
    expect(resolveChartColor('#123456', 0)).toBe('#123456');
    expect(resolveChartColor('var(--nova-color-ink-3)', 2)).toBe(
      'var(--nova-color-ink-3)',
    );
  });

  it('assigns slots in order when no colour is given', () => {
    expect(resolveChartColor(undefined, 0)).toBe(NOVA_CHART_PALETTE[0]);
    expect(resolveChartColor(undefined, 3)).toBe(NOVA_CHART_PALETTE[3]);
  });

  it('never cycles: a seventh series is neutral, not a repeat of the first', () => {
    const seventh = resolveChartColor(undefined, 6);
    expect(NOVA_CHART_PALETTE).not.toContain(seventh);
    expect(seventh).toBe('var(--nova-color-ink-3)');
  });
});
