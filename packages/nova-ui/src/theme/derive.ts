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
  // The highlight family: HOS Violet's is the prototype's sky (semantic.ts), and a hospital's is that
  // sky moved to its own hue, keeping the violet-to-sky step between brand and highlight.
  '--nova-color-highlight',
  '--nova-color-highlight-soft',
  '--nova-color-highlight-deep',
  '--nova-color-highlight-hover',
  // The AI family (AI_SCHEME_TOKENS below): brand-derived since the owner's decision of 2026-10-07.
  '--nova-color-ai',
  '--nova-color-ai-deep',
  '--nova-color-ai-soft',
  '--nova-color-ai-ghost',
  '--nova-color-ai-line',
  '--nova-color-ai-hover',
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
  // The highlight on the chrome: the hero's far stop and the end of the .sb-bar fill.
  '--nova-color-chrome-glow-2',
  '--nova-color-sidebar-1',
  '--nova-color-sidebar-2',
  '--nova-color-sidebar-3',
  '--nova-color-sidebar-lift',
  // The AI's single-value colours (AI_FIXED_TOKENS below): the same in both schemes, like the chrome.
  '--nova-color-ai-bright',
  '--nova-color-ai-mark-1',
  '--nova-color-ai-mark-2',
  '--nova-color-ai-mark-3',
  '--nova-color-ai-mark-4',
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

// The AI follows the hospital theme (owner decision, 2026-10-07), and must stay recognisable: never
// mistaken for the brand or for a status. Its colours are HOS Violet's (the prototype's cyan) turned
// to an AI hue chosen per brand, each pinned back to its own luminance, so every AI contrast the
// prototype holds (AI text on its tints, white on the AI fill, AI marks) holds for every hospital.
export const AI_SCHEME_TOKENS = [
  '--nova-color-ai',
  '--nova-color-ai-deep',
  '--nova-color-ai-soft',
  '--nova-color-ai-ghost',
  '--nova-color-ai-line',
  '--nova-color-ai-hover',
] as const;

export const AI_FIXED_TOKENS = [
  '--nova-color-ai-bright',
  '--nova-color-ai-mark-1',
  '--nova-color-ai-mark-2',
  '--nova-color-ai-mark-3',
  '--nova-color-ai-mark-4',
] as const;

type AiToken =
  | (typeof AI_SCHEME_TOKENS)[number]
  | (typeof AI_FIXED_TOKENS)[number];

// How far the AI stays from the others, measured on the OKLCH hue circle and as OKLab distance
// (x 100) between the AI fill and each status fill or the brand primary, in each scheme. The status
// floor sits just under the prototype's own pair (its cyan is 30.6 degrees from info in the light
// scheme, 29.8 in the dark, where each colour is re-pinned; ΔE 7.1 and 6.5); the brand gets more room
// (the prototype holds 63.6 degrees and 18.8), since the brand fills the screen. A brand whose chroma
// is under greyChroma has no hue to confuse, so only the colour distance applies to it. The chart
// palette keeps its own rule (a series is at least 10 from the AI, OKLab x 100; palette.spec.ts), so
// the AI keeps chartDeltaE from every series in each scheme too.
export const AI_SEPARATION = {
  statusHue: 28,
  brandHue: 45,
  deltaE: 6,
  chartDeltaE: 10,
  greyChroma: 0.03,
} as const;

const CHART_SLOTS = [1, 2, 3, 4, 5, 6] as const;
const schemeValue = (
  token: keyof typeof NOVA_DEFAULTS,
  scheme: 'light' | 'dark',
) =>
  scheme === 'dark' && token in NOVA_DARK
    ? NOVA_DARK[token as keyof typeof NOVA_DARK]
    : NOVA_DEFAULTS[token];
const CHART_COLOURS = {
  light: CHART_SLOTS.map((slot) =>
    schemeValue(`--nova-chart-${slot}`, 'light'),
  ),
  dark: CHART_SLOTS.map((slot) => schemeValue(`--nova-chart-${slot}`, 'dark')),
};

// One of HOS Violet's colours turned by `rotation` degrees of hue and pinned back to its luminance.
function turn(hex: string, rotation: number): string {
  if (rotation === 0) return hex;
  const { l, c, h } = toOklch(hex);
  const turned = toOklch(fromOklch({ l, c, h: h + rotation }));
  return withLuminance(turned.h, turned.c, relativeLuminance(hex));
}

const STATUSES = ['good', 'warn', 'crit', 'info'] as const;

// The status fills' hues (good, warn, crit, info): fixed for every hospital.
export const STATUS_HUES: readonly number[] = STATUSES.map(
  (status) => toOklch(NOVA_DEFAULTS[`--nova-color-${status}`]).h,
);

export const PROTOTYPE_AI_HUE = toOklch(NOVA_DEFAULTS['--nova-color-ai']).h;

const hueDistance = (a: number, b: number) => Math.abs(hueDelta(a, b));

// OKLab distance x 100 (the dataviz scale: 10 is clearly another colour, 2 a just-noticeable step).
export function oklabDistance(a: string, b: string): number {
  const lab = (hex: string): [number, number, number] => {
    const { l, c, h } = toOklch(hex);
    const radians = (h * Math.PI) / 180;
    return [l, c * Math.cos(radians), c * Math.sin(radians)];
  };
  const [x, y] = [lab(a), lab(b)];
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

// The AI hue for a brand. The prototype's cyan, while its colours keep every floor in both schemes.
// Otherwise the hue that keeps the most distance from the brand and the statuses (the smallest of its
// hue distances, as large as it can be), nearest the cyan on a tie, among the hues whose colours keep
// every floor in both schemes (AI_SEPARATION: hue and colour distance from each status and the brand,
// colour distance from each chart series). `feasible` is false when no hue does, and the theme is
// then rejected.
export function chooseAiHue(
  primary: string,
  statusHues: readonly number[] = STATUS_HUES,
): { hue: number; feasible: boolean } {
  const brand = toOklch(primary);
  const chromatic = brand.c >= AI_SEPARATION.greyChroma;
  const fromStatus = (h: number) =>
    Math.min(...statusHues.map((status) => hueDistance(h, status)));
  const fromBrand = (h: number) =>
    chromatic ? hueDistance(h, brand.h) : Infinity;
  // Given status hues of its own (a test of the rule), only the hue floors are measured.
  const custom = statusHues !== STATUS_HUES;
  // The brand primary in each scheme, as the engine derives it (the dark one is re-pinned).
  const primaries = {
    light: primary,
    dark: withLuminance(
      brand.h,
      brand.c,
      DARK_BRAND_LUMINANCE.primary,
      'darker',
    ),
  };
  // Whether the AI colours at a hue keep every floor, measured as the gate measures them.
  const keepsFloors = (h: number) =>
    fromStatus(h) >= AI_SEPARATION.statusHue &&
    fromBrand(h) >= AI_SEPARATION.brandHue &&
    (custom ||
      (['light', 'dark'] as const).every((scheme) => {
        const p: Record<string, string> = {
          '--nova-color-ai': turn(
            schemeValue('--nova-color-ai', scheme),
            hueDelta(PROTOTYPE_AI_HUE, h),
          ),
          '--nova-color-primary': primaries[scheme],
        };
        for (const status of STATUSES) {
          p[`--nova-color-${status}`] = schemeValue(
            `--nova-color-${status}`,
            scheme,
          );
        }
        CHART_SLOTS.forEach((slot, index) => {
          p[`--nova-chart-${slot}`] = CHART_COLOURS[scheme][index] ?? '';
        });
        return aiSeparationFailures(p, scheme).length === 0;
      }));
  if (keepsFloors(PROTOTYPE_AI_HUE)) {
    return { hue: PROTOTYPE_AI_HUE, feasible: true };
  }
  // Best first: the largest smallest-distance, then nearest the cyan.
  const ranked = Array.from({ length: 720 }, (_, i) => i / 2)
    .map((h) => ({ h, score: Math.min(fromStatus(h), fromBrand(h)) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        hueDistance(a.h, PROTOTYPE_AI_HUE) - hueDistance(b.h, PROTOTYPE_AI_HUE),
    );
  const chosen = ranked.find(({ h }) => keepsFloors(h));
  return chosen
    ? { hue: chosen.h, feasible: true }
    : { hue: ranked[0]?.h ?? PROTOTYPE_AI_HUE, feasible: false };
}

// HOS Violet's AI colours in one scheme, turned by `rotation` degrees of hue and pinned back to their
// own luminance. No rotation is the prototype's values exactly.
function aiFamily(
  scheme: 'light' | 'dark',
  rotation: number,
): Record<AiToken, string> {
  const values = {} as Record<AiToken, string>;
  for (const token of [...AI_SCHEME_TOKENS, ...AI_FIXED_TOKENS]) {
    values[token] = turn(schemeValue(token, scheme), rotation);
  }
  return values;
}

export interface AiSeparation {
  // The smallest hue distance from a status fill, and from the brand (Infinity for a grey brand).
  statusHue: number;
  brandHue: number;
  // The smallest OKLab distance (x 100) from a status fill, from the brand primary and from a chart
  // series.
  statusDeltaE: number;
  brandDeltaE: number;
  chartDeltaE: number;
}

// How far one scheme's AI fill sits from the status fills and the brand primary.
export function aiSeparation(p: Record<string, string>): AiSeparation {
  const ai = p['--nova-color-ai'] ?? '';
  const primary = p['--nova-color-primary'] ?? '';
  const hue = toOklch(ai).h;
  const brand = toOklch(primary);
  const statuses = STATUSES.map((status) => p[`--nova-color-${status}`] ?? '');
  return {
    statusHue: Math.min(
      ...statuses.map((status) => hueDistance(hue, toOklch(status).h)),
    ),
    brandHue:
      brand.c >= AI_SEPARATION.greyChroma
        ? hueDistance(hue, brand.h)
        : Infinity,
    statusDeltaE: Math.min(
      ...statuses.map((status) => oklabDistance(ai, status)),
    ),
    brandDeltaE: oklabDistance(ai, primary),
    chartDeltaE: Math.min(
      ...CHART_SLOTS.map((slot) =>
        oklabDistance(ai, p[`--nova-chart-${slot}`] ?? ''),
      ),
    ),
  };
}

export interface AiSeparationFailure {
  scheme: 'light' | 'dark';
  reason: string;
}

// Every way one scheme's AI fill sits too close to a status fill or to the brand, with the reason.
export function aiSeparationFailures(
  p: Record<string, string>,
  scheme: 'light' | 'dark',
): AiSeparationFailure[] {
  const ai = p['--nova-color-ai'] ?? '';
  const hue = toOklch(ai).h;
  const failures: AiSeparationFailure[] = [];
  const others: Array<[name: string, colour: string, floor: number]> = [
    ...STATUSES.map((status): [string, string, number] => [
      status,
      p[`--nova-color-${status}`] ?? '',
      AI_SEPARATION.statusHue,
    ]),
    ['the brand', p['--nova-color-primary'] ?? '', AI_SEPARATION.brandHue],
  ];
  for (const [name, colour, floor] of others) {
    const other = toOklch(colour);
    const greyBrand =
      name === 'the brand' && other.c < AI_SEPARATION.greyChroma;
    const degrees = hueDistance(hue, other.h);
    if (!greyBrand && degrees < floor) {
      failures.push({
        scheme,
        reason: `AI ${ai} is ${degrees.toFixed(1)}° from ${name} ${colour}; needs at least ${floor}°`,
      });
    }
    const delta = oklabDistance(ai, colour);
    if (delta < AI_SEPARATION.deltaE) {
      failures.push({
        scheme,
        reason: `AI ${ai} is ${delta.toFixed(1)} (OKLab) from ${name} ${colour}; needs at least ${AI_SEPARATION.deltaE}`,
      });
    }
  }
  for (const slot of CHART_SLOTS) {
    const series = p[`--nova-chart-${slot}`] ?? '';
    const delta = oklabDistance(ai, series);
    if (delta < AI_SEPARATION.chartDeltaE) {
      failures.push({
        scheme,
        reason: `AI ${ai} is ${delta.toFixed(1)} (OKLab) from chart series ${slot} ${series}; needs at least ${AI_SEPARATION.chartDeltaE}`,
      });
    }
  }
  return failures;
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

// Darkens a moved colour until `blend` (the luminance it shows through a glass layer) is no lighter
// than `ceiling`, HOS Violet's own.
function noLighterThan(
  moved: string,
  ceiling: number,
  blend: (hex: string) => number,
): string {
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
    const overWhite = (hex: string) =>
      relativeLuminance(mixColours(hex, alpha, '#FFFFFF'));
    moved[token] = noLighterThan(
      moved[token],
      overWhite(palette[token]),
      overWhite,
    );
  }
  // The hero's far stop, the sky glow, is seen at its own alpha over the hero base over white: kept no
  // lighter there than HOS Violet's, so white text and the hero's secondary ink keep their ratios.
  const glow = '--nova-color-chrome-glow-2';
  const base = '--nova-color-chrome-1';
  const { heroEndAlpha, heroBaseAlpha } = MATERIAL_LEVELS.glass;
  const overHero = (baseHex: string) => (hex: string) =>
    relativeLuminance(
      mixColours(
        hex,
        heroEndAlpha,
        mixColours(baseHex, heroBaseAlpha, '#FFFFFF'),
      ),
    );
  moved[glow] = noLighterThan(
    moved[glow],
    overHero(palette[base])(palette[glow]),
    overHero(moved[base]),
  );
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

  // The AI turns from the prototype's cyan to the hue chosen for this brand.
  const rotation = hueDelta(PROTOTYPE_AI_HUE, chooseAiHue(primary).hue);
  return {
    light: {
      ...light,
      ...aiFamily('light', rotation),
      '--nova-color-primary': primary,
      '--nova-color-primary-strong': strong,
      '--nova-color-primary-soft': soft,
      '--nova-color-primary-hover': strong,
    },
    dark: {
      ...dark,
      ...aiFamily('dark', rotation),
      ...darkBrandFamily(primary),
    },
  };
}
