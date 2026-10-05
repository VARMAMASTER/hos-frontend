import { NOVA_DEFAULTS, type NovaVariable } from '../tokens/semantic';
import { contrastRatio, isHexColour } from './contrast';

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
}

export interface NovaTheme {
  name: string;
  cssVariables: Partial<Record<NovaVariable, string>>;
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

const MIN_CONTRAST = 4.5;
const PLAIN_FONT_STACK = /^[\w\s",'-]+$/;

export function createNovaTheme(input: NovaThemeInput): NovaTheme {
  const { name } = input;
  const brand: NovaBrand = input.brand ?? {};
  const cssVariables: Partial<Record<NovaVariable, string>> = {};

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
        `Theme "${name}": ${resolve(foreground)} on ${resolve(background)} gives ${ratio.toFixed(2)}:1 for ${usedBy} — needs at least ${MIN_CONTRAST}:1.`,
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
    cssVariables['--nova-font-body'] = brand.fontBody;
  }

  return { name, cssVariables };
}
