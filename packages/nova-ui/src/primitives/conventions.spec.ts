// @vitest-environment node
// Nova's component rules, enforced. Components are composed from tokens and primitives (SOLID:
// each primitive has one job, components depend on them instead of re-implementing them), so a
// change to class merging, the focus ring or a surface happens in one place and reaches all of them.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const componentsDir = fileURLToPath(new URL('../components', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    const isSource =
      /\.tsx?$/.test(name) && !/\.(spec|stories)\.tsx?$/.test(name);
    return isSource ? [path] : [];
  });
}

const files = sourceFiles(componentsDir).map((path) => ({
  path: path.slice(componentsDir.length + 1),
  text: readFileSync(path, 'utf8'),
}));

const offenders = (pattern: RegExp) =>
  files.filter((file) => pattern.test(file.text)).map((file) => file.path);

describe('component conventions', () => {
  it('finds the component sources it polices', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('merges classes with cx, never a hand-rolled filter/join', () => {
    expect(offenders(/\.filter\(Boolean\)\s*\.join\(/)).toEqual([]);
  });

  it('takes the keyboard focus ring from focusRing, never its own outline classes', () => {
    expect(offenders(/focus-visible:outline-/)).toEqual([]);
  });

  it('never writes a raw hex colour — colour comes from semantic tokens', () => {
    expect(offenders(/['"`]#[0-9a-fA-F]{3,8}\b/)).toEqual([]);
  });

  it('never reaches for the stock Tailwind palette', () => {
    expect(
      offenders(
        /\b(?:bg|text|border|ring|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/,
      ),
    ).toEqual([]);
  });

  it('never writes its own backdrop-filter — material comes from the surface utilities', () => {
    expect(offenders(/backdrop-(?:filter|blur)/)).toEqual([]);
  });
});
