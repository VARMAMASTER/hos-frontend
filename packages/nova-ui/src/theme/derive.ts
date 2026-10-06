import { MATERIAL_LEVELS } from '../tokens/material';
import { NOVA_DARK } from '../tokens/scheme';
import { NOVA_DEFAULTS } from '../tokens/semantic';
import { mixColours } from './contrast';
import {
  fromOklch,
  hueDelta,
  relativeLuminance,
  rgbChannels,
  toOklch,
  withLuminance,
} from './colour';

// The HOS default brand. Its derived palette is the prototype's own (os/public/assets/hos.css),
// value for value.
export const HOS_VIOLET = NOVA_DEFAULTS['--nova-color-primary'];

// Every token a hospital's brand recolours, in two groups.
//
// Scheme tokens differ between light and dark: the canvas, the panels, the lines, the inks and the
// brand family. Chrome tokens are the dark app frame (top bar, sidebar, hero), which is dark in both
// schemes, so one value serves both.
export const BRAND_SCHEME_TOKENS = [
  '--nova-color-bg',
  '--nova-color-surface',
  '--nova-color-surface-2',
  '--nova-color-border',
  '--nova-color-border-strong',
  '--nova-color-border-control',
  '--nova-color-ink',
  '--nova-color-ink-2',
  '--nova-color-ink-3',
  '--nova-color-primary',
  '--nova-color-primary-strong',
  '--nova-color-primary-soft',
  '--nova-color-primary-ghost',
  '--nova-color-primary-hover',
] as const;

export const BRAND_CHROME_TOKENS = [
  '--nova-color-chrome-1',
  '--nova-color-chrome-2',
  '--nova-color-chrome-3',
  '--nova-color-chrome-glass',
  '--nova-color-chrome-ink',
  '--nova-color-chrome-ink-2',
  '--nova-color-chrome-accent',
  '--nova-color-chrome-accent-soft',
  '--nova-color-chrome-ring',
  '--nova-color-sidebar-1',
  '--nova-color-sidebar-2',
  '--nova-color-sidebar-3',
  '--nova-color-sidebar-lift',
] as const;

export type BrandSchemeToken = (typeof BRAND_SCHEME_TOKENS)[number];
export type BrandChromeToken = (typeof BRAND_CHROME_TOKENS)[number];
export type BrandToken = BrandSchemeToken | BrandChromeToken;

// One scheme's brand-derived values: every BrandToken.
export type BrandPalette = Record<BrandToken, string>;

export interface NovaPalette {
  light: BrandPalette;
  dark: BrandPalette;
}

export interface BrandColours {
  primary: string;
  primaryStrong?: string;
  primarySoft?: string;
}

// The translucent chrome tokens are their opaque base at a fixed alpha, as in the prototype.
const TRANSLUCENT: Record<
  | '--nova-color-chrome-glass'
  | '--nova-color-chrome-ink-2'
  | '--nova-color-chrome-accent-soft',
  readonly [base: BrandChromeToken, alpha: number]
> = {
  '--nova-color-chrome-glass': ['--nova-color-chrome-1', 0.6],
  '--nova-color-chrome-ink-2': ['--nova-color-chrome-ink', 0.66],
  '--nova-color-chrome-accent-soft': ['--nova-color-chrome-accent', 0.18],
};

export function rgba(hex: string, alpha: number): string {
  return `rgba(${rgbChannels(hex).join(', ')}, ${alpha.toFixed(2)})`;
}

// The luminances the brand family is pinned to in the dark scheme. Status fills sit at the same
// point (tokens/scheme.ts): white text holds 4.5:1 on the fill, and the fill holds 3:1 as a mark
// (a focus ring, a selected edge, a dot) on every dark panel. Strong is brand text on a dark panel.
export const DARK_BRAND_LUMINANCE = {
  primary: 0.175,
  primaryStrong: 0.42,
  primarySoft: 0.022,
  primaryGhost: 0.016,
  primaryHover: 0.11,
} as const;

// The light brand family the engine suggests for a colour: its hue and chroma at HOS Violet's own
// luminances (#6D4FE0, #5636B8, #EFEAFC). Used for a rejected brand's suggestion, and for a
// stored row that carries a primary alone.
export function suggestNovaBrand(colour: string): Required<BrandColours> {
  const { c, h } = toOklch(colour);
  const at = (token: keyof typeof NOVA_DEFAULTS, chroma: number) =>
    withLuminance(
      h,
      chroma,
      relativeLuminance(NOVA_DEFAULTS[token]),
      token === '--nova-color-primary-soft' ? 'lighter' : 'darker',
    );
  return {
    primary: at('--nova-color-primary', c),
    primaryStrong: at('--nova-color-primary-strong', c),
    primarySoft: at('--nova-color-primary-soft', Math.min(c, 0.03)),
  };
}

function darkBrandFamily(primary: string) {
  const { c, h } = toOklch(primary);
  const L = DARK_BRAND_LUMINANCE;
  return {
    '--nova-color-primary': withLuminance(h, c, L.primary, 'darker'),
    '--nova-color-primary-strong': withLuminance(
      h,
      c * 0.8,
      L.primaryStrong,
      'lighter',
    ),
    '--nova-color-primary-soft': withLuminance(
      h,
      Math.min(c, 0.06),
      L.primarySoft,
      'darker',
    ),
    '--nova-color-primary-ghost': withLuminance(
      h,
      Math.min(c, 0.035),
      L.primaryGhost,
    ),
    '--nova-color-primary-hover': withLuminance(h, c, L.primaryHover),
  } satisfies Partial<BrandPalette>;
}

// HOS Violet's palette in one scheme: the template every other brand is moved from.
function template(scheme: 'light' | 'dark'): BrandPalette {
  const values: Record<string, string> = {};
  for (const token of [...BRAND_SCHEME_TOKENS, ...BRAND_CHROME_TOKENS]) {
    values[token] =
      scheme === 'dark' && token in NOVA_DARK
        ? NOVA_DARK[token as keyof typeof NOVA_DARK]
        : NOVA_DEFAULTS[token];
  }
  return values as BrandPalette;
}

// Moves one of HOS Violet's colours to the brand: rotated to the brand's hue, its chroma scaled by
// how colourful the brand is, then pinned back to its original luminance.
function mover(primary: string) {
  const violet = toOklch(HOS_VIOLET);
  const brand = toOklch(primary);
  const rotate = hueDelta(violet.h, brand.h);
  // Square root, so a muted brand (slate) still tints its chrome a little, and a brand as vivid as
  // the violet or more keeps the prototype's chroma.
  const scale = Math.sqrt(Math.min(1, brand.c / violet.c));
  return (hex: string): string => {
    const { l, c, h } = toOklch(hex);
    const moved = fromOklch({ l, c: c * scale, h: h + rotate });
    const { c: fitted, h: hue } = toOklch(moved);
    return withLuminance(hue, fitted, relativeLuminance(hex));
  };
}

// The chrome a glass layer lets white show through: the top bar's light end and the hero's base,
// at the lowest opacity any material paints them. Blending happens in sRGB, not in luminance, so a
// moved colour at its template's luminance can still blend lighter over white than the template
// did; these are darkened until their blend is no lighter than HOS Violet's, which keeps white text
// and the chrome's secondary ink at the proven contrast.
const SEEN_OVER_WHITE: ReadonlyArray<readonly [BrandChromeToken, number]> = [
  ['--nova-color-chrome-3', MATERIAL_LEVELS.glass.chromeEndAlpha],
  ['--nova-color-chrome-1', MATERIAL_LEVELS.glass.heroBaseAlpha],
];

function noLighterOverWhite(
  moved: string,
  original: string,
  alpha: number,
): string {
  const ceiling = relativeLuminance(mixColours(original, alpha, '#FFFFFF'));
  const blend = (hex: string) =>
    relativeLuminance(mixColours(hex, alpha, '#FFFFFF'));
  if (blend(moved) <= ceiling) return moved;
  const { c, h } = toOklch(moved);
  let target = relativeLuminance(moved);
  let result = moved;
  while (blend(result) > ceiling && target > 0) {
    target -= 0.0005;
    result = withLuminance(h, c, target, 'darker');
  }
  return result;
}

function movePalette(
  palette: BrandPalette,
  move: (hex: string) => string,
): BrandPalette {
  const moved: Record<string, string> = {};
  for (const [token, value] of Object.entries(palette)) {
    if (!(token in TRANSLUCENT)) moved[token] = move(value);
  }
  for (const [token, alpha] of SEEN_OVER_WHITE) {
    moved[token] = noLighterOverWhite(moved[token], palette[token], alpha);
  }
  for (const [token, [base, alpha]] of Object.entries(TRANSLUCENT)) {
    moved[token] = rgba(moved[base], alpha);
  }
  return moved as BrandPalette;
}

// The whole brand-dependent palette, light and dark, from a hospital's brand colours. HOS Violet's is
// the prototype's palette exactly. Any other brand moves every colour to its own hue at the same
// WCAG luminance, so each contrast the prototype holds, it holds; the light brand family is the
// hospital's own, and the dark one is pinned to DARK_BRAND_LUMINANCE.
export function deriveNovaPalette(brand: BrandColours): NovaPalette {
  const primary = brand.primary.toUpperCase();
  const suggested =
    brand.primaryStrong && brand.primarySoft
      ? undefined
      : suggestNovaBrand(primary);
  const strong = (
    brand.primaryStrong ??
    suggested?.primaryStrong ??
    ''
  ).toUpperCase();
  const soft = (
    brand.primarySoft ??
    suggested?.primarySoft ??
    ''
  ).toUpperCase();

  const isViolet = primary === HOS_VIOLET.toUpperCase();
  const move = isViolet ? (hex: string) => hex : mover(primary);
  const light = isViolet
    ? template('light')
    : movePalette(template('light'), move);
  const dark = isViolet
    ? template('dark')
    : movePalette(template('dark'), move);

  return {
    light: {
      ...light,
      '--nova-color-primary': primary,
      '--nova-color-primary-strong': strong,
      '--nova-color-primary-soft': soft,
      '--nova-color-primary-hover': strong,
    },
    dark: { ...dark, ...darkBrandFamily(primary) },
  };
}
