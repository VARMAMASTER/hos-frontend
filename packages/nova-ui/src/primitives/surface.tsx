import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
} from 'react';
import { cx } from './cx';

// The material roles theme.css defines. A component picks a role; the role's tokens decide what
// glass or solid looks like. Adding a surface means adding a token block, never editing components.
// card, field, data and ai-block stay opaque under either material, as the prototype keeps them; surface,
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
export type SurfaceRadius = 'sm' | 'md' | 'lg' | 'xl';

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
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
};

export type SurfaceProps = {
  as?: ElementType;
  material: SurfaceMaterial;
  radius?: SurfaceRadius;
} & Omit<ComponentPropsWithoutRef<'div'>, 'color'>;

// The primitive every container is built from: Card, HeroBand, KpiTile, menus, dialogs, tables. The
// default radius stays lg; the prototype's card radius is md, which each card-like component asks for.
export const Surface = forwardRef<HTMLElement, SurfaceProps>(function Surface(
  { as: Element = 'div', material, radius = 'lg', className, ...rest },
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
