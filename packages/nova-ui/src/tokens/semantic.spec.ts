// @vitest-environment node
// Reads theme.css from disk and needs no DOM. Under the project's default jsdom
// environment, `new URL(<relative>, import.meta.url)` resolves against jsdom's
// http://localhost origin instead of the file's location, so it is not a file: URL.
import { readFileSync } from 'node:fs';
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
        match[2].trim(),
      ]),
    );
    expect(declared).toEqual(NOVA_DEFAULTS);
  });
});

// docs/design-language/README.md: Apple's craft on Nova's identity.
describe('the Apple-refined token set', () => {
  it('sets Inter as the body face and keeps IBM Plex Mono for figures and IDs', () => {
    expect(NOVA_DEFAULTS['--nova-font-body']).toBe(
      '"Inter", system-ui, -apple-system, sans-serif',
    );
    expect(NOVA_DEFAULTS['--nova-font-mono']).toMatch(/^"IBM Plex Mono"/);
  });

  it('uses the radius grammar 6 / 10 / 14 / 20 and nothing in between', () => {
    expect([
      NOVA_DEFAULTS['--nova-radius-sm'],
      NOVA_DEFAULTS['--nova-radius-md'],
      NOVA_DEFAULTS['--nova-radius-lg'],
      NOVA_DEFAULTS['--nova-radius-xl'],
    ]).toEqual(['6px', '10px', '14px', '20px']);
  });

  it.each([
    ['micro', '11px', '14px'],
    ['caption', '13px', '18px'],
    ['callout', '15px', '20px'],
    ['body', '17px', '24px'],
    ['headline', '20px', '26px'],
    ['title3', '28px', '34px'],
    ['title2', '40px', '46px'],
    ['title1', '56px', '60px'],
  ] as const)(
    'declares the %s step of the type ramp at %s on a %s line',
    (step, size, lineHeight) => {
      const defaults: Record<string, string> = NOVA_DEFAULTS;
      expect(defaults[`--nova-text-${step}`]).toBe(size);
      expect(defaults[`--nova-text-${step}--line-height`]).toBe(lineHeight);
    },
  );

  it('tightens headline tracking by about one hundredth of an em', () => {
    expect(NOVA_DEFAULTS['--nova-tracking-tight']).toBe('-0.01em');
  });
});
