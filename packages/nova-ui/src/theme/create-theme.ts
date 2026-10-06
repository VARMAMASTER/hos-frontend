import {
  isNovaMaterial,
  NOVA_MATERIALS,
  type NovaMaterial,
} from '../tokens/material';
import type { NovaVariable } from '../tokens/semantic';
import { isHexColour } from './contrast';
import {
  BRAND_CHROME_TOKENS,
  BRAND_SCHEME_TOKENS,
  deriveNovaPalette,
  suggestNovaBrand,
  type NovaPalette,
} from './derive';
import {
  legibilityFailures,
  resolvePalette,
  type LegibilityCheck,
  type NovaSchemeName,
} from './legibility';

export class NovaThemeError extends Error {
  override name = 'NovaThemeError';
}

export interface NovaBrand {
  primary?: string;
  primaryStrong?: string;
  primarySoft?: string;
  fontBody?: string;
}

export interface NovaThemeInput {
  name: string;
  brand?: NovaBrand;
  // The hospital's override of the product-wide material; unset (or a NULL column) keeps the default.
  material?: NovaMaterial | null;
}

export interface NovaTheme {
  name: string;
  // The light scheme's values: the hospital's brand colours and everything derived from them.
  cssVariables: Partial<Record<NovaVariable, string>>;
  // The dark scheme's values of the tokens that change with the scheme.
  darkVariables?: Partial<Record<NovaVariable, string>>;
  material?: NovaMaterial;
}

const BRAND_COLOURS = {
  primary: '--nova-color-primary',
  primaryStrong: '--nova-color-primary-strong',
  primarySoft: '--nova-color-primary-soft',
} as const;

const FONT_BODY = '--nova-font-body';

// The only variables a hospital theme writes: its brand-derived palette (theme/derive.ts) and the
// body font. Status, AI and chart tokens are never tenant-overridable. applyNovaTheme and
// NovaThemeProvider write nothing else, and they rebuild the palette from the brand colours alone, so
// a theme that skipped createNovaTheme (a database row cast to NovaTheme) can neither recolour
// critical or AI nor set an ink, a canvas or a chrome colour of its own.
export const NOVA_THEME_VARIABLES: readonly NovaVariable[] = Object.freeze([
  ...BRAND_SCHEME_TOKENS,
  ...BRAND_CHROME_TOKENS,
  FONT_BODY,
]);

const PLAIN_FONT_STACK = /^[\w\s",'-]+$/;

// Whether this browser resolves light-dark(), which carries the scheme in every brand colour. Without
// it (or before the DOM exists, where the modern answer is assumed) a theme writes its light values
// only, and the page stays in the light scheme.
export function supportsLightDark(): boolean {
  const css = (
    globalThis as { CSS?: { supports?: (...args: string[]) => boolean } }
  ).CSS;
  if (typeof css?.supports !== 'function') return true;
  return css.supports('color', 'light-dark(#000, #fff)');
}

const hexOrUndefined = (value: unknown) =>
  isHexColour(value) ? value : undefined;

// The palette a theme's brand colours derive. Only the brand inputs are read (a primary that is not a
// hex colour means no brand at all), so anything else a stored row carries is ignored.
function paletteOf(
  theme: Pick<NovaTheme, 'cssVariables'> | undefined,
): NovaPalette | undefined {
  const variables = theme?.cssVariables ?? {};
  const primary = hexOrUndefined(variables[BRAND_COLOURS.primary]);
  if (primary === undefined) return undefined;
  return deriveNovaPalette({
    primary,
    primaryStrong: hexOrUndefined(variables[BRAND_COLOURS.primaryStrong]),
    primarySoft: hexOrUndefined(variables[BRAND_COLOURS.primarySoft]),
  });
}

// The variables a theme writes. Each scheme token is light-dark(light, dark), so one inline style
// serves both schemes and a nested scheme (or `system`) picks its own; pass lightDark: false for a
// browser without light-dark(). The chrome is dark in both schemes, so it is a single value.
export function themeVariables(
  theme: Pick<NovaTheme, 'cssVariables'> | undefined,
  { lightDark = true }: { lightDark?: boolean } = {},
): Partial<Record<NovaVariable, string>> {
  const allowed: Partial<Record<NovaVariable, string>> = {};
  const palette = paletteOf(theme);
  if (palette !== undefined) {
    for (const token of BRAND_SCHEME_TOKENS) {
      allowed[token] = lightDark
        ? `light-dark(${palette.light[token]}, ${palette.dark[token]})`
        : palette.light[token];
    }
    for (const token of BRAND_CHROME_TOKENS) {
      allowed[token] = palette.light[token];
    }
  }
  const font = theme?.cssVariables[FONT_BODY];
  if (typeof font === 'string' && PLAIN_FONT_STACK.test(font)) {
    allowed[FONT_BODY] = font;
  }
  return allowed;
}

// Rounded down, so a ratio just under the floor never reads as meeting it ("4.50:1 … needs 4.5:1").
function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 100) / 100).toFixed(2);
}

function rejection(
  name: string,
  failure: LegibilityCheck,
  scheme: NovaSchemeName,
  material: NovaMaterial,
  primary: string,
): NovaThemeError {
  const where =
    scheme === 'light' && material === 'glass'
      ? ''
      : ` (${scheme} scheme, ${material})`;
  const canvas = failure.usedBy === 'brand text on the canvas';
  const solidHelps = canvas && material !== 'solid';
  const suggestion = suggestNovaBrand(primary);
  const advice = solidHelps
    ? ' Choose a darker brand colour or set material to "solid".'
    : ' Choose a darker brand colour.';
  return new NovaThemeError(
    `Theme "${name}": ${failure.foreground} on ${failure.backgroundName} gives ${formatRatio(failure.ratio)}:1 for ${failure.usedBy}${where} — needs at least ${failure.minimum}:1.${advice} Try primary ${suggestion.primary}, primaryStrong ${suggestion.primaryStrong} and primarySoft ${suggestion.primarySoft}: this hue at HOS Violet's lightness.`,
  );
}

export function createNovaTheme(input: NovaThemeInput): NovaTheme {
  const { name } = input;
  const brand: NovaBrand = input.brand ?? {};

  const material = input.material ?? undefined;
  if (material !== undefined && !isNovaMaterial(material)) {
    throw new NovaThemeError(
      `Theme "${name}": material must be "glass", "frost" or "solid" (got "${String(material)}").`,
    );
  }

  const brandKeys = Object.keys(BRAND_COLOURS) as Array<
    keyof typeof BRAND_COLOURS
  >;
  const given = brandKeys.filter((key) => brand[key] !== undefined);
  if (given.length > 0 && given.length < brandKeys.length) {
    throw new NovaThemeError(
      `Theme "${name}": brand.primary, brand.primaryStrong and brand.primarySoft must all three be set together (got ${given.join(', ')}).`,
    );
  }
  for (const key of given) {
    const value = brand[key];
    if (!isHexColour(value)) {
      throw new NovaThemeError(
        `Theme "${name}": brand.${key} must be a 6-digit hex colour like #6D4FE0, got "${String(value)}".`,
      );
    }
  }

  if (brand.fontBody !== undefined) {
    if (
      typeof brand.fontBody !== 'string' ||
      !PLAIN_FONT_STACK.test(brand.fontBody)
    ) {
      throw new NovaThemeError(
        `Theme "${name}": brand.fontBody must be a plain font stack like "Inter", sans-serif.`,
      );
    }
  }

  const cssVariables: Partial<Record<NovaVariable, string>> = {};
  const darkVariables: Partial<Record<NovaVariable, string>> = {};
  if (given.length > 0) {
    const primary = brand.primary as string;
    const palette = deriveNovaPalette({
      primary,
      primaryStrong: brand.primaryStrong,
      primarySoft: brand.primarySoft,
    });
    // Every pairing, in both schemes, on the hospital's own material or (left to the product) on
    // each of them, the light scheme on glass first: that is where the prototype's gate stood.
    const materials = material === undefined ? NOVA_MATERIALS : [material];
    for (const scheme of ['light', 'dark'] as const) {
      for (const each of materials) {
        const [failure] = legibilityFailures(
          resolvePalette(scheme, palette),
          scheme,
          each,
        );
        if (failure !== undefined) {
          throw rejection(name, failure, scheme, each, primary);
        }
      }
    }
    for (const token of [...BRAND_SCHEME_TOKENS, ...BRAND_CHROME_TOKENS]) {
      cssVariables[token] = palette.light[token];
    }
    for (const token of BRAND_SCHEME_TOKENS) {
      darkVariables[token] = palette.dark[token];
    }
  }
  if (brand.fontBody !== undefined) cssVariables[FONT_BODY] = brand.fontBody;

  const theme: NovaTheme = { name, cssVariables };
  if (Object.keys(darkVariables).length > 0)
    theme.darkVariables = darkVariables;
  if (material !== undefined) theme.material = material;
  return theme;
}
