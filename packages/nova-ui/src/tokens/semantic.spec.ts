// @vitest-environment node
// Reads theme.css from disk and needs no DOM. Under the project's default jsdom
// environment, `new URL(<relative>, import.meta.url)` resolves against jsdom's
// http://localhost origin instead of the file's location, so it is not a file: URL.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { NOVA_DEFAULTS } from './semantic';

describe('theme.css defaults', () => {
  it('declares exactly the values NOVA_DEFAULTS declares, so CSS and TypeScript never drift', () => {
    const css = readFileSync(
      fileURLToPath(new URL('../styles/theme.css', import.meta.url)),
      'utf8',
    );
    // Only the plain `:root {` block: the material blocks (`:root, [data-nova-material…]`) are
    // checked against MATERIAL_TOKENS in material.spec.ts.
    const start = css.search(/:root\s*\{/);
    const rootBlock = css.slice(start, css.indexOf('}', start));
    const declared = Object.fromEntries(
      [...rootBlock.matchAll(/(--nova-[\w-]+):\s*([^;]+);/g)].map((match) => [
        match[1],
        match[2].replace(/\s+/g, ' ').trim(),
      ]),
    );
    expect(declared).toEqual(NOVA_DEFAULTS);
  });
});

// Every prototype token Nova carries, under its Nova name. The prototype is binding: a value differs
// only where an accessibility proof holds it, and those are listed in HELD_BY_A_PROOF.
const PROTOTYPE_NAMES: Record<string, keyof typeof NOVA_DEFAULTS> = {
  '--bg': '--nova-color-bg',
  '--panel': '--nova-color-surface',
  '--panel-2': '--nova-color-surface-2',
  '--line': '--nova-color-border',
  '--line-strong': '--nova-color-border-strong',
  '--ink': '--nova-color-ink',
  '--ink-2': '--nova-color-ink-2',
  '--ink-3': '--nova-color-ink-3',
  '--chrome-1': '--nova-color-chrome-1',
  '--chrome-2': '--nova-color-chrome-2',
  '--chrome-3': '--nova-color-chrome-3',
  '--chrome-glass': '--nova-color-chrome-glass',
  '--chrome-line': '--nova-color-chrome-line',
  '--chrome-ink': '--nova-color-chrome-ink',
  '--chrome-ink-2': '--nova-color-chrome-ink-2',
  '--chrome-accent': '--nova-color-chrome-accent',
  '--chrome-accent-soft': '--nova-color-chrome-accent-soft',
  '--chrome-glow-2': '--nova-color-chrome-glow-2',
  '--teal': '--nova-color-primary',
  '--teal-strong': '--nova-color-primary-strong',
  '--teal-soft': '--nova-color-primary-soft',
  '--teal-ghost': '--nova-color-primary-ghost',
  '--ai': '--nova-color-ai',
  '--ai-bright': '--nova-color-ai-bright',
  '--ai-deep': '--nova-color-ai-deep',
  '--ai-soft': '--nova-color-ai-soft',
  '--ai-ghost': '--nova-color-ai-ghost',
  '--ai-line': '--nova-color-ai-line',
  '--ai-grad': '--nova-gradient-ai',
  '--ai-mark': '--nova-ai-mark',
  '--good': '--nova-color-good',
  '--good-soft': '--nova-color-good-soft',
  '--good-deep': '--nova-color-good-deep',
  '--warn': '--nova-color-warn',
  '--warn-soft': '--nova-color-warn-soft',
  '--warn-deep': '--nova-color-warn-deep',
  '--crit': '--nova-color-crit',
  '--crit-soft': '--nova-color-crit-soft',
  '--crit-deep': '--nova-color-crit-deep',
  '--info': '--nova-color-info',
  '--info-soft': '--nova-color-info-soft',
  '--info-deep': '--nova-color-info-deep',
  '--r-sm': '--nova-radius-sm',
  '--r-md': '--nova-radius-md',
  '--r-lg': '--nova-radius-lg',
  '--r-xl': '--nova-radius-xl',
  '--r-full': '--nova-radius-full',
  ...Object.fromEntries(
    Array.from({ length: 11 }, (_, step) => [
      `--space-${step}`,
      `--nova-space-${step}` as keyof typeof NOVA_DEFAULTS,
    ]),
  ),
  '--shadow-hue': '--nova-shadow-hue',
  '--shadow-sm': '--nova-shadow-sm',
  '--shadow-md': '--nova-shadow-md',
  '--shadow-lg': '--nova-shadow-lg',
  '--shadow-glass': '--nova-shadow-glass',
  '--sidebar-w': '--nova-sidebar-w',
  '--f-display': '--nova-font-display',
  '--f-body': '--nova-font-body',
  '--f-mono': '--nova-font-mono',
};

// The prototype value, and the Nova value that replaces it, for each token an accessibility proof
// holds (material.spec.ts proves both). The AI gradient's last stop is the prototype's own violet,
// pinned so a hospital brand cannot recolour it.
const HELD_BY_A_PROOF: Record<string, [prototype: string, nova: string]> = {
  '--ink-3': ['#6A6584', '#5D5974'],
  '--ai-grad': [
    'linear-gradient(135deg, var(--ai-bright) 0%, var(--ai) 48%, var(--teal) 105%)',
    'linear-gradient(135deg, var(--nova-color-ai-bright) 0%, var(--nova-color-ai) 48%, #6D4FE0 105%)',
  ],
};

describe('the prototype token set (hos.css :root)', () => {
  it('names every prototype token Nova carries', () => {
    expect(Object.keys(PROTOTYPE_NAMES)).toHaveLength(67);
    for (const name of Object.values(PROTOTYPE_NAMES)) {
      expect(NOVA_DEFAULTS, name).toHaveProperty(name);
    }
  });

  it('uses Google Sans Flex for display and body and IBM Plex Mono for figures', () => {
    expect(NOVA_DEFAULTS['--nova-font-body']).toBe(
      '"Google Sans Flex", system-ui, -apple-system, sans-serif',
    );
    expect(NOVA_DEFAULTS['--nova-font-display']).toBe(
      NOVA_DEFAULTS['--nova-font-body'],
    );
    expect(NOVA_DEFAULTS['--nova-font-mono']).toMatch(/^"IBM Plex Mono"/);
  });

  it('tints every shadow to the violet shadow hue, never neutral black', () => {
    expect(NOVA_DEFAULTS['--nova-shadow-hue']).toBe('262deg 45% 27%');
    for (const size of ['sm', 'md', 'lg', 'glass'] as const) {
      const value = NOVA_DEFAULTS[`--nova-shadow-${size}`];
      for (const layer of value.split(/,(?![^(]*\))/)) {
        expect(layer.trim()).toMatch(
          /hsl\(var\(--nova-shadow-hue\) \/ \.\d+\)$/,
        );
      }
      expect(value).not.toMatch(/#000|rgb\(0 0 0|black/);
    }
  });

  it('holds only ink-3 and the AI gradient stop away from the prototype, for a proof', () => {
    for (const [prototype, [, nova]] of Object.entries(HELD_BY_A_PROOF)) {
      expect(NOVA_DEFAULTS[PROTOTYPE_NAMES[prototype]], prototype).toBe(nova);
    }
  });

  // The prototype lives beside the product in the HOS workspace (os/public/assets/hos.css); where it
  // is present, every value is compared with it directly.
  const hosCss = [1, 2, 3, 4, 5, 6, 7]
    .map((up) =>
      fileURLToPath(
        new URL(`${'../'.repeat(up)}os/public/assets/hos.css`, import.meta.url),
      ),
    )
    .find((path) => existsSync(path));
  it.runIf(hosCss !== undefined)(
    'carries every other prototype value verbatim, with prototype var() names renamed to Nova names',
    () => {
      const source = readFileSync(hosCss ?? '', 'utf8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      );
      const root = source.slice(
        source.indexOf(':root {'),
        source.indexOf('}', source.indexOf(':root {')),
      );
      const prototype = Object.fromEntries(
        [...root.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((match) => [
          match[1],
          match[2].replace(/\s+/g, ' ').trim(),
        ]),
      );
      const renamed = (value: string) =>
        value.replace(
          /var\((--[\w-]+)\)/g,
          (_, name: string) => `var(${PROTOTYPE_NAMES[name] ?? name})`,
        );
      for (const [name, nova] of Object.entries(PROTOTYPE_NAMES)) {
        const held = HELD_BY_A_PROOF[name];
        expect(prototype[name], name).toBe(held ? held[0] : prototype[name]);
        const expected = held ? held[1] : renamed(prototype[name] ?? '');
        expect(NOVA_DEFAULTS[nova], name).toBe(expected);
      }
    },
  );
});
