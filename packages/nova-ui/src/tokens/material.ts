import type { NovaVariable } from './semantic';

// Material is a design-system setting, independent of the hospital (tenant) theme and of the scheme.
// Glass is the product default and is the prototype's own glass (os/public/assets/hos.css): the
// chrome, the hero band, glass panels and floating overlays frost; cards, fields and data stay solid,
// as the prototype keeps them ("glass never under dense data"). Frost is a heavier, more opaque,
// tinted glass for legibility; solid is the prototype's opaque fallbacks. A hospital's theme may
// choose any of the three, and theme.css forces solid when the OS asks for reduced transparency or
// more contrast, or the browser cannot blur.
export type NovaMaterial = 'glass' | 'frost' | 'solid';

export const NOVA_MATERIALS: readonly NovaMaterial[] = [
  'glass',
  'frost',
  'solid',
];

export const NOVA_DEFAULT_MATERIAL: NovaMaterial = 'glass';

export function isNovaMaterial(value: unknown): value is NovaMaterial {
  return value === 'glass' || value === 'frost' || value === 'solid';
}

// What a material is made of: numbers only, never a brand colour, so a material switched anywhere
// in the tree combines with whichever hospital theme is nearest (theme.css builds the fills from
// these and the theme's colours, at every theme and material scope).
export interface MaterialLevels {
  // 1 where the canvas shows its aurora and panels show their glass rim, 0 on solid.
  glass: 0 | 1;
  // Panel and overlay fills: the panel colour at this opacity, tinted toward panel-2 by `tint`.
  surfaceAlpha: number;
  surfaceTint: number;
  overlayAlpha: number;
  overlayTint: number;
  // The rims and top highlights, as a share of the sheen (white in the light scheme).
  surfaceRim: number;
  surfaceSheen: number;
  overlayRim: number;
  overlaySheen: number;
  // The top bar: chrome-1 into chrome-3, at these opacities.
  chromeStartAlpha: number;
  chromeEndAlpha: number;
  // The hero: chrome-2 into the sky glow (chrome-3 on solid), over chrome-1 (chrome-2 on solid).
  heroStartAlpha: number;
  heroEndAlpha: number;
  heroBaseAlpha: number;
  surfaceFilter: string;
  overlayFilter: string;
  chromeFilter: string;
  heroFilter: string;
}

export const MATERIAL_LEVELS: Record<NovaMaterial, MaterialLevels> = {
  // The prototype's glass, value for value, except where a proof holds it (GLASS, below).
  glass: {
    glass: 1,
    // .glass-panel: rgba(255,255,255,.72).
    surfaceAlpha: 0.72,
    surfaceTint: 0,
    // .glass-card is rgba(255,255,255,.62). A menu anchored in the opaque sidebar composites over
    // its darkest stop, where ink-3 needs at least 0.83 to hold 4.5:1.
    overlayAlpha: 0.83,
    overlayTint: 0,
    surfaceRim: 0.5,
    surfaceSheen: 0.7,
    overlayRim: 0.6,
    overlaySheen: 0.65,
    // The top bar: linear-gradient(120deg, rgba(23,15,48,.85), rgba(59,33,120,.72)). A sticky bar
    // scrolls over white cards, and its secondary ink only holds 4.5:1 there with the light end at
    // 0.78.
    chromeStartAlpha: 0.85,
    chromeEndAlpha: 0.78,
    // .glass-hero: linear-gradient(120deg, rgba(42,27,92,.92), rgba(96,165,250,.55)) over
    // --chrome-glass (.6). White text holds 4.5:1 at the sky end only with the base at 0.9.
    heroStartAlpha: 0.92,
    heroEndAlpha: 0.55,
    heroBaseAlpha: 0.9,
    surfaceFilter: 'blur(14px) saturate(140%)',
    overlayFilter: 'blur(20px) saturate(160%)',
    chromeFilter: 'blur(16px) saturate(150%)',
    heroFilter: 'blur(20px) saturate(160%)',
  },
  // Frost: twice the blur, more opaque, and tinted toward panel-2 (which carries the brand's hue), so
  // it reads as frosted glass and holds text more firmly than glass does over a busy backdrop.
  frost: {
    glass: 1,
    surfaceAlpha: 0.86,
    surfaceTint: 1,
    overlayAlpha: 0.92,
    overlayTint: 1,
    surfaceRim: 0.6,
    surfaceSheen: 0.8,
    overlayRim: 0.7,
    overlaySheen: 0.75,
    chromeStartAlpha: 0.92,
    chromeEndAlpha: 0.88,
    heroStartAlpha: 0.95,
    heroEndAlpha: 0.55,
    heroBaseAlpha: 0.94,
    surfaceFilter: 'blur(28px) saturate(180%)',
    overlayFilter: 'blur(32px) saturate(180%)',
    chromeFilter: 'blur(28px) saturate(170%)',
    heroFilter: 'blur(32px) saturate(170%)',
  },
  // Solid: every fill opaque, nothing blurred, the panel's own line for an edge.
  solid: {
    glass: 0,
    surfaceAlpha: 1,
    surfaceTint: 0,
    overlayAlpha: 1,
    overlayTint: 0,
    surfaceRim: 0,
    surfaceSheen: 0,
    overlayRim: 0,
    overlaySheen: 0,
    chromeStartAlpha: 1,
    chromeEndAlpha: 1,
    heroStartAlpha: 1,
    heroEndAlpha: 1,
    heroBaseAlpha: 1,
    surfaceFilter: 'none',
    overlayFilter: 'none',
    chromeFilter: 'none',
    heroFilter: 'none',
  },
};

// The numbers glass legibility rests on. theme.css uses the same values (material.spec.ts checks),
// and the proofs show text at 4.5:1 (and control edges and the focus ring at 3:1) for any brand. Each
// is the prototype's value unless a proof holds it; those say so and give the prototype's.
export const GLASS = {
  // The aurora behind the canvas: the prototype's mesh geometry, tinted by both brand blobs at
  // canvasTint and the fixed accent hues at canvasAccentTint. Breadcrumbs, page tabs and headings sit
  // straight on the canvas, so these are the strengths at which ink-3 still holds 4.5:1 under the
  // darkest tint any brand could bring (the prototype paints 0.22-0.30, which no small print survives).
  canvasTint: 0.1,
  canvasAccents: ['#60A5FA', '#22D3EE'],
  canvasAccentTint: 0.06,
  surfaceAlpha: MATERIAL_LEVELS.glass.surfaceAlpha,
  overlayAlpha: MATERIAL_LEVELS.glass.overlayAlpha,
  topbarStartAlpha: MATERIAL_LEVELS.glass.chromeStartAlpha,
  topbarEndAlpha: MATERIAL_LEVELS.glass.chromeEndAlpha,
  // The secondary ink on the top bar (the prototype's .5-.66 white) and inside its search field.
  chromeInk2Alpha: 0.88,
  // The white lift of the top bar's search field: rgba(255,255,255,.08).
  chromeFieldAlpha: 0.08,
  // The sidebar's lift (radial, rgba(109,79,224,.42) screened over the base): the brand at 42%.
  sidebarBrandShare: 0.42,
  // The secondary ink on the sidebar (--chrome-ink-2 at .66 and the .42-.5 labels): .7 holds 4.5:1
  // under the lift for the lightest brand the theme gate allows.
  sidebarInk2Alpha: 0.7,
  heroSkyAlpha: MATERIAL_LEVELS.glass.heroEndAlpha,
  heroBaseAlpha: MATERIAL_LEVELS.glass.heroBaseAlpha,
  // The secondary hero ink (the prototype's .68 white).
  heroInk2Alpha: 0.9,
  // The tab rail's chrome-2 tint over the canvas (.tabbar: rgba(42,27,92,.07)).
  tabbarTint: 0.07,
} as const;

const percent = (share: number) => `${Math.round(share * 100)}%`;
const sheen = (share: number) =>
  `color-mix(in srgb, var(--nova-color-sheen) ${percent(share)}, transparent)`;

function materialTokens(levels: MaterialLevels): Record<NovaVariable, string> {
  const solid = levels.glass === 0;
  return {
    '--nova-glass': String(levels.glass),
    '--nova-surface-alpha': percent(levels.surfaceAlpha),
    '--nova-surface-tint': percent(levels.surfaceTint),
    '--nova-surface-filter': levels.surfaceFilter,
    '--nova-surface-rim': solid ? 'transparent' : sheen(levels.surfaceRim),
    '--nova-surface-shadow': solid
      ? 'var(--nova-shadow-sm)'
      : `var(--nova-shadow-md), inset 0 1px 0 0 ${sheen(levels.surfaceSheen)}`,
    '--nova-overlay-alpha': percent(levels.overlayAlpha),
    '--nova-overlay-tint': percent(levels.overlayTint),
    '--nova-overlay-filter': levels.overlayFilter,
    '--nova-overlay-rim': solid ? 'transparent' : sheen(levels.overlayRim),
    '--nova-overlay-shadow': solid
      ? 'var(--nova-shadow-md)'
      : `var(--nova-shadow-md), inset 0 1px 0 0 ${sheen(levels.overlaySheen)}`,
    '--nova-chrome-alpha-start': percent(levels.chromeStartAlpha),
    '--nova-chrome-alpha-end': percent(levels.chromeEndAlpha),
    '--nova-chrome-filter': levels.chromeFilter,
    '--nova-hero-alpha-start': percent(levels.heroStartAlpha),
    '--nova-hero-alpha-end': percent(levels.heroEndAlpha),
    '--nova-hero-base-alpha': percent(levels.heroBaseAlpha),
    '--nova-hero-filter': levels.heroFilter,
  };
}

// Each material's tokens, as theme.css declares them on [data-nova-material=…].
export const MATERIAL_TOKENS: Record<
  NovaMaterial,
  Record<NovaVariable, string>
> = {
  glass: materialTokens(MATERIAL_LEVELS.glass),
  frost: materialTokens(MATERIAL_LEVELS.frost),
  solid: materialTokens(MATERIAL_LEVELS.solid),
};

// The fills the surface utilities paint, built from the material's numbers and the nearest theme's
// colours. theme.css declares them on every scope that can change either (the root, each theme and
// each material), so a theme inside a material, or a material inside a theme, re-resolves them. On
// glass and frost a panel's edge is the sheen rim; on solid (--nova-glass 0) it is the panel line.
// The hero runs into the sky glow on glass and into chrome-3 on solid, as the prototype's
// no-backdrop-filter fallback does.
const fill = (role: 'surface' | 'overlay') =>
  `color-mix(in srgb, color-mix(in srgb, var(--nova-color-surface-2) var(--nova-${role}-tint), var(--nova-color-surface)) var(--nova-${role}-alpha), transparent)`;
const edge = (role: 'surface' | 'overlay') =>
  `color-mix(in srgb, var(--nova-${role}-rim) calc(var(--nova-glass) * 100%), var(--nova-color-border))`;

export const MATERIAL_FILLS = {
  '--nova-surface-fill': fill('surface'),
  '--nova-surface-border': edge('surface'),
  '--nova-overlay-fill': fill('overlay'),
  '--nova-overlay-border': edge('overlay'),
  '--nova-chrome-fill':
    'linear-gradient(120deg, color-mix(in srgb, var(--nova-color-chrome-1) var(--nova-chrome-alpha-start), transparent), color-mix(in srgb, var(--nova-color-chrome-3) var(--nova-chrome-alpha-end), transparent))',
  '--nova-hero-fill':
    'linear-gradient(120deg, color-mix(in srgb, var(--nova-color-chrome-2) var(--nova-hero-alpha-start), transparent), color-mix(in srgb, color-mix(in srgb, var(--nova-color-chrome-glow-2) calc(var(--nova-glass) * 100%), var(--nova-color-chrome-3)) var(--nova-hero-alpha-end), transparent))',
  '--nova-hero-base':
    'color-mix(in srgb, color-mix(in srgb, var(--nova-color-chrome-1) calc(var(--nova-glass) * 100%), var(--nova-color-chrome-2)) var(--nova-hero-base-alpha), transparent)',
} as const satisfies Record<NovaVariable, string>;
