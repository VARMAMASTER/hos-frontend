import type { NovaVariable } from './semantic';

// Material is a design-system setting, independent of the hospital (tenant) theme. Glass is the
// product default and is the prototype's own glass (os/public/assets/hos.css): the chrome, the hero
// band, glass panels and floating overlays frost; cards, fields and data stay solid, as the prototype
// keeps them ("glass never under dense data"). A hospital's theme may switch to solid, and theme.css
// forces solid when the OS asks for reduced transparency or more contrast.
export type NovaMaterial = 'glass' | 'solid';

export const NOVA_MATERIALS: readonly NovaMaterial[] = ['glass', 'solid'];

export const NOVA_DEFAULT_MATERIAL: NovaMaterial = 'glass';

export function isNovaMaterial(value: unknown): value is NovaMaterial {
  return value === 'glass' || value === 'solid';
}

// The numbers glass legibility rests on. theme.css uses the same values (material.spec.ts checks),
// and the spec proves text stays at 4.5:1 (and control edges and the focus ring at 3:1) for any
// brand. Each is the prototype's value unless a proof holds it; those say so and give the prototype's.
export const GLASS = {
  // The aurora behind the canvas: the prototype's mesh geometry, tinted by both brand blobs at
  // canvasTint and the fixed accent hues at canvasAccentTint. Breadcrumbs, page tabs and headings sit
  // straight on the canvas, so these are the strengths at which ink-3 still holds 4.5:1 under the
  // darkest tint any brand could bring (the prototype paints 0.22-0.30, which no small print survives).
  canvasTint: 0.1,
  canvasAccents: ['#60A5FA', '#22D3EE'],
  canvasAccentTint: 0.06,
  // .glass-panel: rgba(255,255,255,.72).
  surfaceAlpha: 0.72,
  // .glass-card is rgba(255,255,255,.62). A menu anchored in the opaque sidebar composites over its
  // darkest stop, where ink-3 needs at least 0.83 to hold 4.5:1.
  overlayAlpha: 0.83,
  // The top bar: linear-gradient(120deg, rgba(23,15,48,.85), rgba(59,33,120,.72)). A sticky bar
  // scrolls over white cards, and its secondary ink only holds 4.5:1 there with the light end at 0.78.
  topbarStartAlpha: 0.85,
  topbarEndAlpha: 0.78,
  // The secondary ink on the top bar (the prototype's .5-.66 white) and inside its search field.
  chromeInk2Alpha: 0.88,
  // The white lift of the top bar's search field: rgba(255,255,255,.08).
  chromeFieldAlpha: 0.08,
  // The sidebar's violet lift (radial, rgba(109,79,224,.42) screened over the base): the brand at 42%.
  sidebarBrandShare: 0.42,
  // The secondary ink on the sidebar (--chrome-ink-2 at .66 and the .42-.5 labels): .7 holds 4.5:1
  // under the lift for the lightest brand the theme gate allows.
  sidebarInk2Alpha: 0.7,
  // .glass-hero: linear-gradient(120deg, rgba(42,27,92,.92), rgba(96,165,250,.55)) over --chrome-glass
  // (.6). White text holds 4.5:1 at the sky end only with the base at 0.9, and the secondary hero ink
  // (the prototype's .68 white) at 0.9.
  heroSkyAlpha: 0.55,
  heroBaseAlpha: 0.9,
  heroInk2Alpha: 0.9,
} as const;

// The material roles' tokens. Glass is the prototype's .glass-panel, .glass-card, .topbar and
// .glass-hero; solid is its opaque card, menu, and the prototype's own no-backdrop-filter fallbacks.
export const MATERIAL_TOKENS = {
  glass: {
    '--nova-glass': '1',
    '--nova-surface-fill': `rgb(255 255 255 / ${GLASS.surfaceAlpha})`,
    '--nova-surface-filter': 'blur(14px) saturate(140%)',
    '--nova-surface-border': 'rgb(255 255 255 / 0.5)',
    '--nova-surface-shadow':
      'var(--nova-shadow-md), inset 0 1px 0 0 rgb(255 255 255 / 0.7)',
    '--nova-overlay-fill': `rgb(255 255 255 / ${GLASS.overlayAlpha})`,
    '--nova-overlay-filter': 'blur(20px) saturate(160%)',
    '--nova-overlay-border': 'rgb(255 255 255 / 0.6)',
    '--nova-overlay-shadow':
      'var(--nova-shadow-md), inset 0 1px 0 0 rgb(255 255 255 / 0.65)',
    '--nova-chrome-fill': `linear-gradient(120deg, rgb(23 15 48 / ${GLASS.topbarStartAlpha}), rgb(59 33 120 / ${GLASS.topbarEndAlpha}))`,
    '--nova-chrome-filter': 'blur(16px) saturate(150%)',
    '--nova-hero-fill': `linear-gradient(120deg, rgb(42 27 92 / 0.92), rgb(96 165 250 / ${GLASS.heroSkyAlpha}))`,
    '--nova-hero-base': `rgb(23 15 48 / ${GLASS.heroBaseAlpha})`,
    '--nova-hero-filter': 'blur(20px) saturate(160%)',
  },
  solid: {
    '--nova-glass': '0',
    '--nova-surface-fill': 'var(--nova-color-surface)',
    '--nova-surface-filter': 'none',
    '--nova-surface-border': 'var(--nova-color-border)',
    '--nova-surface-shadow': 'var(--nova-shadow-sm)',
    '--nova-overlay-fill': 'var(--nova-color-surface)',
    '--nova-overlay-filter': 'none',
    '--nova-overlay-border': 'var(--nova-color-border)',
    '--nova-overlay-shadow': 'var(--nova-shadow-md)',
    '--nova-chrome-fill':
      'linear-gradient(120deg, var(--nova-color-chrome-1), var(--nova-color-chrome-3))',
    '--nova-chrome-filter': 'none',
    '--nova-hero-fill':
      'linear-gradient(120deg, var(--nova-color-chrome-2), var(--nova-color-chrome-3))',
    '--nova-hero-base': 'var(--nova-color-chrome-2)',
    '--nova-hero-filter': 'none',
  },
} as const satisfies Record<NovaMaterial, Record<NovaVariable, string>>;
