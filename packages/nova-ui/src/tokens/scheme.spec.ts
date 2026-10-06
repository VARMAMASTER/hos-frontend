// @vitest-environment node
// Reads theme.css from disk (see semantic.spec.ts for why this runs under node).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { toOklch, withLuminance } from '../theme/colour';
import { contrastRatio } from '../theme/contrast';
import {
  isNovaScheme,
  NOVA_DARK,
  NOVA_DEFAULT_SCHEME,
  NOVA_SCHEMES,
} from './scheme';
import { NOVA_DEFAULTS } from './semantic';

const css = readFileSync(
  fileURLToPath(new URL('../styles/theme.css', import.meta.url)),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

describe('the scheme axis', () => {
  it('is light by default, or dark, or system', () => {
    expect(NOVA_DEFAULT_SCHEME).toBe('light');
    expect(NOVA_SCHEMES).toEqual(['light', 'dark', 'system']);
    expect(isNovaScheme('system')).toBe(true);
    expect(isNovaScheme('auto')).toBe(false);
    expect(isNovaScheme(undefined)).toBe(false);
  });

  it('is a color-scheme in theme.css; system follows prefers-color-scheme through light dark', () => {
    expect(squash(css)).toContain(
      "[data-nova-scheme='light'] { color-scheme: light; }",
    );
    expect(squash(css)).toContain(
      "[data-nova-scheme='dark'] { color-scheme: dark; }",
    );
    expect(squash(css)).toContain(
      "[data-nova-scheme='system'] { color-scheme: light dark; }",
    );
  });

  // Every scheme token is light-dark(light, dark) on the root, inside a support query so a browser
  // without light-dark() keeps the light :root block. Light is the prototype's value, dark NOVA_DARK.
  it('pairs every NOVA_DARK token with its light value as light-dark(), behind a support query', () => {
    const start = css.indexOf('@supports (color: light-dark(#000, #fff))');
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(start, css.indexOf('}', start));
    const declared = Object.fromEntries(
      [...block.matchAll(/(--nova-[\w-]+):\s*([^;]+);/g)].map((m) => [
        m[1],
        squash(m[2]),
      ]),
    );
    const expected = Object.fromEntries(
      Object.entries(NOVA_DARK).map(([token, dark]) => [
        token,
        `light-dark(${NOVA_DEFAULTS[token as keyof typeof NOVA_DARK]}, ${dark})`,
      ]),
    );
    expect(declared).toEqual(expected);
  });

  it('changes only colour tokens with the scheme, never a size, a font or the chrome', () => {
    for (const token of Object.keys(NOVA_DARK)) {
      expect(token).toMatch(/^--nova-(color|chart)-/);
      expect(token).not.toMatch(/chrome|sidebar/);
      expect(token in NOVA_DEFAULTS, token).toBe(true);
    }
  });
});

// The dark values are built: the light colour's hue, pinned to a luminance chosen for the proofs.
describe('the dark palette', () => {
  const dark = (token: keyof typeof NOVA_DARK): string => NOVA_DARK[token];
  const statuses = ['good', 'warn', 'crit', 'info', 'ai'] as const;

  it('keeps every status and AI colour on its own hue', () => {
    for (const status of statuses) {
      for (const suffix of ['', '-deep', '-soft'] as const) {
        const token =
          `--nova-color-${status}${suffix}` as keyof typeof NOVA_DARK;
        const light = toOklch(NOVA_DEFAULTS[token]).h;
        const hue = toOklch(dark(token)).h;
        const delta = Math.abs(((hue - light + 540) % 360) - 180);
        expect(delta, token).toBeLessThan(30);
      }
    }
  });

  it('is reproduced by its generator: each status fill at 0.175, its tint at 0.022, its ink at 0.42', () => {
    for (const status of ['good', 'warn', 'crit', 'info', 'ai'] as const) {
      const { h, c } = toOklch(NOVA_DEFAULTS[`--nova-color-${status}`]);
      expect(dark(`--nova-color-${status}`)).toBe(
        withLuminance(h, c, 0.175, 'darker'),
      );
      expect(dark(`--nova-color-${status}-soft`)).toBe(
        withLuminance(h, Math.min(0.05, c), 0.022, 'darker'),
      );
      expect(dark(`--nova-color-${status}-deep`)).toBe(
        withLuminance(h, c * 0.8, 0.42, 'lighter'),
      );
    }
  });

  it('puts white text on every status, AI and brand fill at 4.5:1, and each fill at 3:1 on a dark panel', () => {
    for (const fill of [
      ...statuses.map((s) => `--nova-color-${s}` as const),
      '--nova-color-primary',
      '--nova-color-primary-hover',
      '--nova-color-ai-hover',
    ] as const) {
      expect(contrastRatio('#FFFFFF', dark(fill)), fill).toBeGreaterThanOrEqual(
        4.5,
      );
    }
    for (const fill of [
      ...statuses.map((s) => `--nova-color-${s}` as const),
      '--nova-color-primary',
    ] as const) {
      for (const panel of [
        '--nova-color-surface',
        '--nova-color-surface-2',
      ] as const) {
        expect(
          contrastRatio(dark(fill), dark(panel)),
          `${fill} on ${panel}`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('retunes the data palette for a dark card on the same hues, each series at 3:1', () => {
    for (const slot of [1, 2, 3, 4, 5, 6] as const) {
      const token = `--nova-chart-${slot}` as const;
      const colour =
        (NOVA_DARK as Record<string, string>)[token] ?? NOVA_DEFAULTS[token];
      expect(
        contrastRatio(colour, dark('--nova-color-surface')),
        token,
      ).toBeGreaterThanOrEqual(3);
      const light = toOklch(NOVA_DEFAULTS[token]).h;
      const delta = Math.abs(((toOklch(colour).h - light + 540) % 360) - 180);
      expect(delta, token).toBeLessThanOrEqual(12.5);
    }
  });

  // The data palette's rules (components/chart/palette.spec.ts), in the dark: series stay apart
  // from each other and from every dark status, brand and AI colour.
  it('keeps the dark data palette apart from the dark status, brand and AI colours', () => {
    const oklab = (hex: string) => {
      const { l, c, h } = toOklch(hex);
      const rad = (h * Math.PI) / 180;
      return [l, c * Math.cos(rad), c * Math.sin(rad)];
    };
    const deltaE = (a: string, b: string) => {
      const [x, y] = [oklab(a), oklab(b)];
      return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
    };
    const palette = { ...NOVA_DEFAULTS, ...NOVA_DARK } as Record<
      string,
      string
    >;
    const charts = [1, 2, 3, 4, 5, 6].map((n) => palette[`--nova-chart-${n}`]);
    const reserved = Object.entries(palette).filter(([name]) =>
      /^--nova-color-(good|warn|crit|info|primary|ai)(-strong|-deep)?$/.test(
        name,
      ),
    );
    for (const colour of charts) {
      for (const [name, value] of reserved) {
        expect(
          deltaE(colour, value),
          `${colour} vs ${name}`,
        ).toBeGreaterThanOrEqual(10);
      }
    }
    for (let i = 0; i < charts.length - 1; i++) {
      expect(deltaE(charts[i], charts[i + 1])).toBeGreaterThanOrEqual(15);
    }
  });
});
