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
  LEADING,
  RADIUS_PX,
  RADIUS_ROLES,
  RADIUS_UTILITIES,
  SHADOW_UTILITIES,
  SPACE_NAMES,
  SPACING_PX,
  TRACKING_EM,
  TYPE_ROLES,
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

  // Named after the prototype's own steps, so a name can never be read as one of Tailwind's 4px
  // steps (p-4 does not exist; p-s4 is --space-4, 10px).
  it('names the steps s0 … s10, each mapped to its --nova-space-N in theme.css', () => {
    expect(SPACE_NAMES).toEqual(SPACING_PX.map((_, step) => `s${step}`));
    SPACE_NAMES.forEach((name, step) => {
      expect(declared(`--spacing-${name}`)).toBe(`var(--nova-space-${step})`);
    });
    expect(declared('--spacing-0')).toBe('0px');
    expect(declared('--spacing-px')).toBe('1px');
  });

  // No numeric multiplier: p-4 has nothing to multiply, so only the named steps exist.
  it('declares no numeric spacing multiplier, and resets the stock spacing scale', () => {
    expect(css).not.toMatch(/--spacing:\s*[\d.]+px;/);
    expect(css).toMatch(/--spacing-\*:\s*initial;/);
  });
});

describe('the radius scale and its roles (hos.css --r-*)', () => {
  it('is sm 8, md 12, lg 18, xl 22, plus full (999px)', () => {
    expect(RADIUS_PX).toEqual({ sm: 8, md: 12, lg: 18, xl: 22 });
    expect(defaults['--nova-radius-full']).toBe('999px');
  });

  it.each(Object.entries(RADIUS_PX))(
    'declares --nova-radius-%s at the same px in theme.css and NOVA_DEFAULTS',
    (name, px) => {
      expect(declared(`--nova-radius-${name}`)).toBe(`${px}px`);
      expect(defaults[`--nova-radius-${name}`]).toBe(`${px}px`);
    },
  );

  it('names a role for each corner, every role a step of the scale', () => {
    expect(RADIUS_ROLES).toEqual({
      control: 'sm',
      card: 'md',
      overlay: 'lg',
      hero: 'xl',
      chip: 'full',
      tag: 'sm',
      pill: 'full',
    });
    for (const [role, step] of Object.entries(RADIUS_ROLES)) {
      expect(declared(`--nova-radius-${role}`)).toBe(
        `var(--nova-radius-${step})`,
      );
    }
    expect(RADIUS_UTILITIES).toEqual([
      'rounded-none',
      'rounded-control',
      'rounded-card',
      'rounded-overlay',
      'rounded-hero',
      'rounded-chip',
      'rounded-tag',
      'rounded-pill',
      'rounded-full',
    ]);
  });
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

// The type roles: every prototype size, named by where hos.css uses it.
describe('the type roles', () => {
  it('give every prototype size exactly one role', () => {
    expect(
      Object.values(TYPE_ROLES)
        .map((role) => role.px)
        .sort((x, y) => x - y),
    ).toEqual([...PROTOTYPE_TYPE_SIZES]);
  });

  it('declare each role as --nova-text-<role> at its px, with the body line height', () => {
    for (const [role, { px, source }] of Object.entries(TYPE_ROLES)) {
      expect(declared(`--nova-text-${role}`), role).toBe(`${px}px`);
      expect(declared(`--nova-text-${role}-leading`), role).toBe(
        'var(--nova-leading-body)',
      );
      expect(source.length, role).toBeGreaterThan(0);
    }
  });

  it('carry the prototype line heights and tracking as tokens', () => {
    expect(LEADING.body).toBe(1.55);
    for (const [name, value] of Object.entries(LEADING)) {
      expect(declared(`--nova-leading-${name}`)).toBe(String(value));
    }
    for (const [name, em] of Object.entries(TRACKING_EM)) {
      expect(declared(`--nova-tracking-${name}`)).toBe(`${em}em`);
    }
  });
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
