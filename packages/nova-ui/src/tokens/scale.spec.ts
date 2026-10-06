// @vitest-environment node
// Reads theme.css from disk and needs no DOM (see semantic.spec.ts for why).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  RADIUS_PX,
  RADIUS_UTILITIES,
  SPACING_PX,
  SPACING_STEPS,
  SPACING_UNIT_PX,
} from './scale';
import { NOVA_DEFAULTS } from './semantic';

const css = readFileSync(
  fileURLToPath(new URL('../styles/theme.css', import.meta.url)),
  'utf8',
);
const declared = (name: string) =>
  new RegExp(String.raw`${name}:\s*([^;]+);`).exec(css)?.[1].trim();

describe('the spacing scale', () => {
  it('is the design language scale: 2, 4, 8, 12, 16, 20, 24, 32, 48, 64 px', () => {
    expect(SPACING_PX).toEqual([2, 4, 8, 12, 16, 20, 24, 32, 48, 64]);
  });

  it('is expressed in Tailwind steps of the 4px spacing unit, plus 0 and the 1px hairline', () => {
    expect(SPACING_UNIT_PX).toBe(4);
    expect(SPACING_STEPS).toEqual([
      '0',
      'px',
      '0.5',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '8',
      '12',
      '16',
    ]);
  });

  it('keeps Tailwind on the 4px unit the steps assume, so CSS and TypeScript never drift', () => {
    expect(declared('--spacing')).toBe(`${SPACING_UNIT_PX}px`);
  });
});

describe('the radius grammar', () => {
  it('is sm 6, md 10, lg 14, xl 20, plus none and full', () => {
    expect(RADIUS_PX).toEqual({ sm: 6, md: 10, lg: 14, xl: 20 });
    expect(RADIUS_UTILITIES).toEqual([
      'rounded-none',
      'rounded-sm',
      'rounded-md',
      'rounded-lg',
      'rounded-xl',
      'rounded-full',
    ]);
  });

  it.each(Object.entries(RADIUS_PX))(
    'declares --nova-radius-%s at the same px in theme.css and NOVA_DEFAULTS',
    (name, px) => {
      expect(declared(`--nova-radius-${name}`)).toBe(`${px}px`);
      expect(
        (NOVA_DEFAULTS as Record<string, string>)[`--nova-radius-${name}`],
      ).toBe(`${px}px`);
    },
  );
});
