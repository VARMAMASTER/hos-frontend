import { GLASS, isNovaMaterial, type NovaMaterial } from '../tokens/material';
import { NOVA_DEFAULTS, type NovaVariable } from '../tokens/semantic';
import { contrastRatio, isHexColour, mixColours } from './contrast';

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
  cssVariables: Partial<Record<NovaVariable, string>>;
  material?: NovaMaterial;
}

const BRAND_COLOURS = {
  primary: '--nova-color-primary',
  primaryStrong: '--nova-color-primary-strong',
  primarySoft: '--nova-color-primary-soft',
} as const;

// Every text-on-background pairing a Nova component draws with brand tokens.
// A component that introduces a new brand pairing adds a row here.
const CONTRAST_PAIRS: ReadonlyArray<
  readonly [foreground: NovaVariable, background: NovaVariable, usedBy: string]
> = [
  ['--nova-color-on-primary', '--nova-color-primary', 'primary button text'],
  [
    '--nova-color-on-primary',
    '--nova-color-primary-strong',
    'primary button hover text',
  ],
  [
    '--nova-color-primary-strong',
    '--nova-color-primary-soft',
    'ghost button hover text',
  ],
];

// On glass the hero band is the brand gradient at GLASS.heroOpacity, so the lightest canvas shows
// through and white text loses contrast. Checked unless the hospital chose solid.
const GLASS_HERO_PAIRS: ReadonlyArray<
  readonly [background: NovaVariable, usedBy: string]
> = [
  ['--nova-color-primary-strong', 'hero text on glass, start of the gradient'],
  ['--nova-color-primary', 'hero text on glass, end of the gradient'],
];

const MIN_CONTRAST = 4.5;
const PLAIN_FONT_STACK = /^[\w\s",'-]+$/;

// Rounded down, so a ratio just under the floor never reads as meeting it ("4.50:1 … needs 4.5:1").
function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 100) / 100).toFixed(2);
}

export function createNovaTheme(input: NovaThemeInput): NovaTheme {
  const { name } = input;
  const brand: NovaBrand = input.brand ?? {};
  const cssVariables: Partial<Record<NovaVariable, string>> = {};

  const material = input.material ?? undefined;
  if (material !== undefined && !isNovaMaterial(material)) {
    throw new NovaThemeError(
      `Theme "${name}": material must be "glass" or "solid" (got "${String(material)}").`,
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
    cssVariables[BRAND_COLOURS[key]] = value;
  }

  const resolve = (variable: NovaVariable): string =>
    cssVariables[variable] ??
    NOVA_DEFAULTS[variable as keyof typeof NOVA_DEFAULTS];
  for (const [foreground, background, usedBy] of CONTRAST_PAIRS) {
    const ratio = contrastRatio(resolve(foreground), resolve(background));
    if (ratio < MIN_CONTRAST) {
      throw new NovaThemeError(
        `Theme "${name}": ${resolve(foreground)} on ${resolve(background)} gives ${formatRatio(ratio)}:1 for ${usedBy} — needs at least ${MIN_CONTRAST}:1.`,
      );
    }
  }

  if (material !== 'solid') {
    const text = resolve('--nova-color-on-primary');
    for (const [background, usedBy] of GLASS_HERO_PAIRS) {
      const fill = mixColours(
        resolve(background),
        GLASS.heroOpacity,
        resolve('--nova-color-bg'),
      );
      const ratio = contrastRatio(text, fill);
      if (ratio < MIN_CONTRAST) {
        throw new NovaThemeError(
          `Theme "${name}": ${text} on ${resolve(background)} at ${Math.round(GLASS.heroOpacity * 100)}% glass gives ${formatRatio(ratio)}:1 for ${usedBy} — needs at least ${MIN_CONTRAST}:1. Choose a darker brand colour or set material to "solid".`,
        );
      }
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
    cssVariables['--nova-font-body'] = brand.fontBody;
  }

  return material === undefined
    ? { name, cssVariables }
    : { name, cssVariables, material };
}
