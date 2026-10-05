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
// createNovaTheme gates hero text with them, and the spec proves small text stays at 4.5:1 for any
// brand.
export const GLASS = {
  canvasTint: 0.26,
  surfaceAlpha: 0.78,
  overlayAlpha: 0.84,
  fieldAlpha: 0.88,
  heroOpacity: 0.92,
  chromeOpacity: 0.78,
  chromeBase: '#120C26',
  chromeBrandShare: 0.3,
  chromeInk2Alpha: 0.74,
} as const;

const SHADOW_SM =
  '0 1px 2px hsl(262deg 45% 27% / 0.07), 0 2px 6px -1px hsl(262deg 45% 27% / 0.07)';
const SHADOW_MD =
  '0 2px 4px hsl(262deg 45% 27% / 0.06), 0 8px 16px -4px hsl(262deg 45% 27% / 0.09), 0 20px 32px -10px hsl(262deg 45% 27% / 0.1)';

export const MATERIAL_TOKENS = {
  glass: {
    '--nova-glass': '1',
    '--nova-surface-fill': `rgb(255 255 255 / ${GLASS.surfaceAlpha})`,
    '--nova-surface-filter': 'blur(14px) saturate(140%)',
    '--nova-surface-border': 'rgb(255 255 255 / 0.55)',
    '--nova-surface-shadow': `${SHADOW_MD}, inset 0 1px 0 0 rgb(255 255 255 / 0.7)`,
    '--nova-overlay-fill': `rgb(255 255 255 / ${GLASS.overlayAlpha})`,
    '--nova-overlay-filter': 'blur(20px) saturate(160%)',
    '--nova-overlay-border': 'rgb(255 255 255 / 0.6)',
    '--nova-overlay-shadow': `${SHADOW_MD}, inset 0 1px 0 0 rgb(255 255 255 / 0.65)`,
    '--nova-field-fill': `rgb(255 255 255 / ${GLASS.fieldAlpha})`,
    '--nova-field-filter': 'blur(8px)',
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
    '--nova-surface-shadow': SHADOW_SM,
    '--nova-overlay-fill': 'var(--nova-color-surface)',
    '--nova-overlay-filter': 'none',
    '--nova-overlay-border': 'var(--nova-color-border)',
    '--nova-overlay-shadow': SHADOW_MD,
    '--nova-field-fill': 'var(--nova-color-surface)',
    '--nova-field-filter': 'none',
    '--nova-chrome-opacity': '1',
    '--nova-chrome-filter': 'none',
    '--nova-hero-opacity': '1',
    '--nova-hero-filter': 'none',
  },
} as const satisfies Record<NovaMaterial, Record<NovaVariable, string>>;
