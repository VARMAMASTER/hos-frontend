// @vitest-environment node
// Reads theme.css and the prototype's hos.css from disk and needs no DOM (see semantic.spec.ts).
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DURATION_UTILITIES,
  EASE_UTILITIES,
  FONT_WEIGHT_UTILITIES,
  MOTION_DURATIONS_MS,
  MOTION_EASINGS,
  PROTOTYPE_TYPE_SIZES,
  RADIUS_PX,
  RADIUS_UTILITIES,
  SHADOW_UTILITIES,
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
const defaults: Record<string, string> = NOVA_DEFAULTS;

describe('the spacing scale (hos.css --space-0 … --space-10)', () => {
  it('is the prototype scale: 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 48 px', () => {
    expect(SPACING_PX).toEqual([2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 48]);
  });

  it('declares each step as --nova-space-N, exactly as the prototype numbers them', () => {
    SPACING_PX.forEach((px, step) => {
      expect(defaults[`--nova-space-${step}`]).toBe(`${px}px`);
    });
  });

  it('is expressed in Tailwind steps of the 4px spacing unit, plus 0 and the 1px hairline', () => {
    expect(SPACING_UNIT_PX).toBe(4);
    expect(SPACING_STEPS).toEqual([
      '0',
      'px',
      '0.5',
      '1',
      '1.5',
      '2',
      '2.5',
      '3',
      '4',
      '5',
      '6',
      '8',
      '12',
    ]);
  });

  it('keeps Tailwind on the 4px unit the steps assume, so CSS and TypeScript never drift', () => {
    expect(declared('--spacing')).toBe(`${SPACING_UNIT_PX}px`);
  });
});

describe('the radius grammar (hos.css --r-*)', () => {
  it('is sm 8, md 12, lg 18, xl 22, plus none and full (999px)', () => {
    expect(RADIUS_PX).toEqual({ sm: 8, md: 12, lg: 18, xl: 22 });
    expect(defaults['--nova-radius-full']).toBe('999px');
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
      expect(defaults[`--nova-radius-${name}`]).toBe(`${px}px`);
    },
  );
});

describe('the type sizes', () => {
  it('are every font-size hos.css declares, ascending, and nothing else', () => {
    expect(PROTOTYPE_TYPE_SIZES).toEqual([
      9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 20, 23, 26,
    ]);
  });

  // The prototype lives beside the product in the HOS workspace (os/public/assets/hos.css, some
  // directories up from this checkout); where it is present, the list is proven against it directly.
  const hosCss = [1, 2, 3, 4, 5, 6, 7]
    .map((up) =>
      fileURLToPath(
        new URL(`${'../'.repeat(up)}os/public/assets/hos.css`, import.meta.url),
      ),
    )
    .find((path) => existsSync(path));
  it.runIf(hosCss !== undefined)(
    'match the font sizes in the prototype stylesheet',
    () => {
      const sizes = [
        ...readFileSync(hosCss ?? '', 'utf8').matchAll(
          /font-size:\s*([\d.]+)px/g,
        ),
      ].map((match) => Number(match[1]));
      expect([...new Set(sizes)].sort((a, b) => a - b)).toEqual([
        ...PROTOTYPE_TYPE_SIZES,
      ]);
    },
  );
});

describe('the shadow scale and the weights', () => {
  it('names the four prototype shadows as shadow-sm | md | lg | glass', () => {
    expect(SHADOW_UTILITIES).toEqual([
      'shadow-sm',
      'shadow-md',
      'shadow-lg',
      'shadow-glass',
    ]);
  });

  it('allows the weights the prototype uses: 400, 500, 600, 700', () => {
    expect(FONT_WEIGHT_UTILITIES).toEqual([
      'font-normal',
      'font-medium',
      'font-semibold',
      'font-bold',
    ]);
  });
});

// Motion: the prototype moves quietly (120-200ms ease-out). These are Nova's named curves and
// durations, so a component asks for ease-standard and duration-base instead of writing its own;
// a component still applies them under motion-safe, so prefers-reduced-motion turns motion off.
describe('the motion tokens', () => {
  it('names three easing curves and three durations, as Nova tokens', () => {
    expect(MOTION_EASINGS).toEqual({
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      standard: 'cubic-bezier(0.2, 0, 0, 1)',
      emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    });
    expect(MOTION_DURATIONS_MS).toEqual({ fast: 150, base: 200, slow: 240 });
    for (const [name, curve] of Object.entries(MOTION_EASINGS)) {
      expect(defaults[`--nova-ease-${name}`]).toBe(curve);
      expect(declared(`--nova-ease-${name}`)).toBe(curve);
    }
    for (const [name, ms] of Object.entries(MOTION_DURATIONS_MS)) {
      expect(defaults[`--nova-duration-${name}`]).toBe(`${ms}ms`);
      expect(declared(`--nova-duration-${name}`)).toBe(`${ms}ms`);
    }
  });

  it('reaches Tailwind as ease-spring | standard | emphasized and duration-fast | base | slow', () => {
    expect(EASE_UTILITIES).toEqual([
      'ease-spring',
      'ease-standard',
      'ease-emphasized',
    ]);
    expect(DURATION_UTILITIES).toEqual([
      'duration-fast',
      'duration-base',
      'duration-slow',
    ]);
    for (const name of Object.keys(MOTION_EASINGS)) {
      expect(declared(`--ease-${name}`)).toBe(`var(--nova-ease-${name})`);
    }
    for (const name of Object.keys(MOTION_DURATIONS_MS)) {
      expect(css).toMatch(
        new RegExp(
          String.raw`@utility duration-${name} \{\s*transition-duration: var\(--nova-duration-${name}\);\s*\}`,
        ),
      );
    }
  });
});
