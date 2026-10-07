import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
} from 'react';
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
// The corner is a radius role (tokens/scale.ts RADIUS_ROLES): control, card, overlay or hero. The
// scale names sm | md | lg | xl are the same corners, kept only until every caller names its role:
// conventions.spec.ts counts each one left (radius-scale) in primitives/conversion-baseline.json, and
// once none is left they go, with this file's entry there.
export type SurfaceRadius =
  | 'control'
  | 'card'
  | 'overlay'
  | 'hero'
  /** @deprecated name the role: 'control' */
  | 'sm'
  /** @deprecated name the role: 'card' */
  | 'md'
  /** @deprecated name the role: 'overlay' */
  | 'lg'
  /** @deprecated name the role: 'hero' */
  | 'xl';

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
  control: 'rounded-control',
  card: 'rounded-card',
  overlay: 'rounded-overlay',
  hero: 'rounded-hero',
  // The scale names keep drawing their scale classes (compiled by the conversion bridge) until every
  // caller names its role, so no component, and no spec, changes before it is converted.
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
// prototype's card corner is card, which each card-like component asks for. The default is still the
// scale name lg (the overlay's corner) while callers are converted; it becomes 'overlay' with them.
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
