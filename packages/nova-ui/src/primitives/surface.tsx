import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
} from 'react';
import type { RadiusRole } from '../tokens/scale';
import { cx } from './cx';

// The material roles theme.css defines. A component picks a role; the role's tokens decide what
// glass, frost or solid looks like, in either scheme. Adding a surface means adding a token block,
// never editing components.
// card, field, data and ai-block stay opaque under every material, as the prototype keeps them; surface,
// overlay, chrome and hero are the prototype's glass; the sidebar is opaque chrome.
export const SURFACE_MATERIALS = [
  'card',
  'surface',
  'overlay',
  'field',
  'chrome',
  'sidebar',
  'hero',
  'data',
  'ai-block',
] as const;

export type SurfaceMaterial = (typeof SURFACE_MATERIALS)[number];
// The corner is a radius role (tokens/scale.ts RADIUS_ROLES), or none: a frame that fills an edge
// (the sidebar, the top bar, a header inside a framed panel) is square, and says so here rather than
// relying on a later rounded-none winning over the default corner.
export const SURFACE_RADII = [
  'none',
  'control',
  'card',
  'overlay',
  'hero',
  'chip',
  'tag',
  'pill',
] as const satisfies ReadonlyArray<RadiusRole | 'none'>;

export type SurfaceRadius = (typeof SURFACE_RADII)[number];

// Whole class names, so Tailwind's scanner finds each utility.
const materials: Record<SurfaceMaterial, string> = {
  card: 'nova-card',
  surface: 'nova-surface',
  overlay: 'nova-overlay',
  field: 'nova-field',
  chrome: 'nova-chrome',
  sidebar: 'nova-sidebar',
  hero: 'nova-hero',
  data: 'nova-data',
  'ai-block': 'nova-ai-block',
};

const radii: Record<SurfaceRadius, string> = {
  none: 'rounded-none',
  control: 'rounded-control',
  card: 'rounded-card',
  overlay: 'rounded-overlay',
  hero: 'rounded-hero',
  chip: 'rounded-chip',
  tag: 'rounded-tag',
  pill: 'rounded-pill',
};

export type SurfaceProps = {
  as?: ElementType;
  material: SurfaceMaterial;
  radius?: SurfaceRadius;
} & Omit<ComponentPropsWithoutRef<'div'>, 'color'>;

// The primitive every container is built from: Card, HeroBand, KpiTile, menus, dialogs, tables. The
// default corner is the overlay's (a floating layer); every card-like component asks for card.
export const Surface = forwardRef<HTMLElement, SurfaceProps>(function Surface(
  { as: Element = 'div', material, radius = 'overlay', className, ...rest },
  ref,
) {
  return (
    <Element
      ref={ref}
      data-surface={material}
      className={cx(materials[material], radii[radius], className)}
      {...rest}
    />
  );
});
