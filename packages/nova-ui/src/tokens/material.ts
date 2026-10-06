import type { NovaVariable } from './semantic';

// Material is a design-system setting, independent of the hospital (tenant) theme: glass frosts
// every component in every theme. Glass is the product default; a hospital's theme may switch to
// solid, and theme.css forces solid when the OS asks for reduced transparency or more contrast.
export type NovaMaterial = 'glass' | 'solid';

export const NOVA_MATERIALS: readonly NovaMaterial[] = ['glass', 'solid'];

export const NOVA_DEFAULT_MATERIAL: NovaMaterial = 'glass';

export function isNovaMaterial(value: unknown): value is NovaMaterial {
  return value === 'glass' || value === 'solid';
}

// The numbers glass legibility rests on. theme.css uses the same values (material.spec.ts checks),
// createNovaTheme gates hero and brand text with them, and the spec proves text stays at 4.5:1 (and
// control edges and the focus ring at 3:1) for any brand.
//
// The canvas tints are deliberately light. Breadcrumbs, page tabs and headings sit straight on the
// canvas, and the proof takes the darkest tint any brand could bring (black) stacked on the darker
// accent at full strength: secondary and small text only hold 4.5:1 there with the brand blobs at
// 10% and the accents at 6%. Those strengths are the ceiling: 11% brand or 7% accent drops ink-3 on
// the darkest canvas below 4.5:1. The aurora gets its colour back by covering more of the canvas
// (larger, softer blobs in theme.css) and by the glass saturating what shows through, never by a
// stronger tint.
export const GLASS = {
  // Both brand blobs of the aurora (primary and primary-strong).
  canvasTint: 0.1,
  // The fixed accent hues of the aurora (sky blue, cyan) and their strength.
  canvasAccents: ['#60A5FA', '#22D3EE'],
  canvasAccentTint: 0.06,
  // Glass panels, overlays and fields: as transparent as the proofs allow, so the frosted aurora
  // shows through. The panel and the field sit on the canvas, whose bare text the proofs already
  // hold at 4.5:1, so no proof limits them; they are set from the design targets (panels 0.55-0.65,
  // fields 0.80-0.85, the field kept the most opaque because typing needs the most legibility). The
  // overlay is limited by the proof for ink-3 on an overlay anchored in the dark chrome: 0.78
  // gives 4.47:1, so 0.79 is the most transparent value that holds 4.5:1.
  surfaceAlpha: 0.55,
  overlayAlpha: 0.79,
  fieldAlpha: 0.8,
  heroOpacity: 0.92,
  chromeOpacity: 0.78,
  chromeBase: '#120C26',
  chromeBrandShare: 0.3,
  // The secondary ink on the chrome; high enough to stay 4.5:1 as a placeholder inside a chrome field.
  chromeInk2Alpha: 0.88,
  // The white lift of a field on the chrome (the top bar's search).
  chromeFieldAlpha: 0.08,
} as const;

// Elevation is flat, the Apple way: depth comes from surface change, 1px hairlines, the glass frost
// and a scrim behind modals, never from a drop shadow. Glass keeps its 1px top highlight, which is
// an inset rim on the panel's own edge, not a shadow cast onto what lies beneath.
export const MATERIAL_TOKENS = {
  glass: {
    '--nova-glass': '1',
    '--nova-surface-fill': `rgb(255 255 255 / ${GLASS.surfaceAlpha})`,
    '--nova-surface-filter': 'blur(24px) saturate(180%)',
    '--nova-surface-border': 'rgb(255 255 255 / 0.55)',
    '--nova-surface-shadow': 'inset 0 1px 0 0 rgb(255 255 255 / 0.7)',
    '--nova-overlay-fill': `rgb(255 255 255 / ${GLASS.overlayAlpha})`,
    '--nova-overlay-filter': 'blur(24px) saturate(180%)',
    '--nova-overlay-border': 'rgb(255 255 255 / 0.6)',
    '--nova-overlay-shadow': 'inset 0 1px 0 0 rgb(255 255 255 / 0.65)',
    '--nova-field-fill': `rgb(255 255 255 / ${GLASS.fieldAlpha})`,
    '--nova-field-filter': 'blur(20px) saturate(160%)',
    '--nova-chrome-opacity': String(GLASS.chromeOpacity),
    '--nova-chrome-filter': 'blur(18px) saturate(150%)',
    '--nova-hero-opacity': String(GLASS.heroOpacity),
    '--nova-hero-filter': 'blur(20px) saturate(160%)',
  },
  solid: {
    '--nova-glass': '0',
    '--nova-surface-fill': 'var(--nova-color-surface)',
    '--nova-surface-filter': 'none',
    '--nova-surface-border': 'var(--nova-color-border)',
    '--nova-surface-shadow': 'none',
    '--nova-overlay-fill': 'var(--nova-color-surface)',
    '--nova-overlay-filter': 'none',
    '--nova-overlay-border': 'var(--nova-color-border)',
    '--nova-overlay-shadow': 'none',
    '--nova-field-fill': 'var(--nova-color-surface)',
    '--nova-field-filter': 'none',
    '--nova-chrome-opacity': '1',
    '--nova-chrome-filter': 'none',
    '--nova-hero-opacity': '1',
    '--nova-hero-filter': 'none',
  },
} as const satisfies Record<NovaMaterial, Record<NovaVariable, string>>;
