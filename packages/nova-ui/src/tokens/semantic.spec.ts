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
    const rootBlock = css.slice(css.indexOf(':root'));
    const declared = Object.fromEntries(
      [...rootBlock.matchAll(/(--nova-[\w-]+):\s*([^;]+);/g)].map((match) => [
        match[1],
        match[2].trim(),
      ]),
    );
    expect(declared).toEqual(NOVA_DEFAULTS);
  });
});
