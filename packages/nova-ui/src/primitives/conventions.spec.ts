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

// Any shadow that is not an elevation class: a stock or arbitrary shadow utility, an inset or drop
// shadow, or a box-shadow declaration (CSS or a style object). Naming box-shadow as a property to
// transition is fine.
const SHADOW_OFFENCE =
  /(?<![\w-])(?:inset-|drop-)?shadow(?:-(?!(?:elevation-(?:1|2|3|button)|none)\b)|(?=['"`\s]))|box-?shadow['"]?\s*:/i;

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

  it('never writes a raw colour as a Tailwind arbitrary value or an inline style either', () => {
    expect(
      offenders(
        /\[(?:color:)?(?:#[0-9a-fA-F]{3,8}|(?:rgb|hsl|oklch)a?\()|style=\{\{[^}]*['"`](?:#[0-9a-fA-F]{3,8}|(?:rgb|hsl|oklch)a?\()/,
      ),
    ).toEqual([]);
  });

  // Surface is the one way to a material role, so a role's tokens and wiring change in one place.
  // nova-field is the exception: it is applied to the form control element itself.
  it('reaches the surface materials only through Surface, never by writing the utility class', () => {
    const material =
      /(?<=['"`\s])nova-(?:surface|overlay|chrome|hero|data)(?=['"`\s])/;
    const code = (text: string) =>
      text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(
      files
        .filter((file) => material.test(code(file.text)))
        .map((file) => file.path),
    ).toEqual([]);
  });

  it('never forces a border colour with an important modifier — a control sets --nova-field-edge instead', () => {
    expect(offenders(/\bborder-[\w-]+!/)).toEqual([]);
  });

  it('never writes its own backdrop-filter — material comes from the surface utilities', () => {
    expect(offenders(/backdrop-(?:filter|blur)/)).toEqual([]);
  });

  // Elevation comes only from the --nova-elevation-* tokens (through the surface utilities, or the
  // shadow-elevation-* classes); a component never invents a shadow.
  it('casts no shadow of its own: only shadow-elevation-1|2|3|button or shadow-none', () => {
    // Comments are prose ("never a shadow"), so only the code is policed.
    const code = (text: string) =>
      text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(
      files
        .filter((file) => SHADOW_OFFENCE.test(code(file.text)))
        .map((file) => file.path),
    ).toEqual([]);
  });

  it('the shadow guard rejects a stock or arbitrary shadow and accepts the elevation classes', () => {
    for (const bad of [
      "'shadow-lg'",
      "'hover:shadow-sm'",
      "'shadow-[0_1px_2px_black]'",
      "'shadow'",
      '{ boxShadow: "0 0 4px" }',
      "'inset-shadow-sm'",
      "'drop-shadow-md'",
    ]) {
      expect(SHADOW_OFFENCE.test(bad), bad).toBe(true);
    }
    for (const good of [
      "'shadow-elevation-1'",
      "'hover:shadow-elevation-2'",
      "'shadow-elevation-button'",
      "'shadow-none'",
      "'[--nova-overlay-lift:var(--nova-elevation-3)]'",
      "'transition-[transform,box-shadow]'",
    ]) {
      expect(SHADOW_OFFENCE.test(good), good).toBe(false);
    }
  });

  // Owner decision: no gradient on any border, edge, rim or button. Gradients live only in the
  // theme.css surface fills (hero, chrome, aurora) and the brand gradient text utility.
  it('never paints a gradient of its own', () => {
    expect(
      offenders(
        /bg-(?:linear|radial|conic|gradient)-|nova-gradient-|gradient\(/,
      ),
    ).toEqual([]);
  });

  // The type ramp is the only set of sizes; an arbitrary size that duplicates a ramp step hides it
  // from a ramp change.
  it('never writes an arbitrary text size that a ramp token already names', () => {
    expect(offenders(/text-\[(?:11|13|15|17|20|28|40|56)px\]/)).toEqual([]);
  });
});

// The weight ladder is 400 / 600 / 700 everywhere, stories included: 500 is banned.
describe('the weight ladder', () => {
  const srcDir = fileURLToPath(new URL('..', import.meta.url));
  const everySource = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return everySource(path);
      return /\.tsx?$/.test(name) && !/\.spec\.tsx?$/.test(name) ? [path] : [];
    });

  it('never uses weight 500 (font-medium) in a component, primitive or story', () => {
    const medium = /\bfont-medium\b|font-\[500\]|fontWeight:\s*['"]?500\b/;
    expect(
      everySource(srcDir)
        .filter((path) => medium.test(readFileSync(path, 'utf8')))
        .map((path) => path.slice(srcDir.length)),
    ).toEqual([]);
  });
});
