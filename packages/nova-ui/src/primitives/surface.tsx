import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
} from 'react';
import { cx } from './cx';

// The material roles theme.css defines. A component picks a role; the role's tokens decide what
// glass or solid looks like. Adding a surface means adding a token block, never editing components.
export const SURFACE_MATERIALS = [
  'surface',
  'overlay',
  'field',
  'chrome',
  'hero',
  'data',
] as const;

export type SurfaceMaterial = (typeof SURFACE_MATERIALS)[number];
export type SurfaceRadius = 'sm' | 'md' | 'lg';

// Whole class names, so Tailwind's scanner finds each utility.
const materials: Record<SurfaceMaterial, string> = {
  surface: 'nova-surface',
  overlay: 'nova-overlay',
  field: 'nova-field',
  chrome: 'nova-chrome',
  hero: 'nova-hero',
  data: 'nova-data',
};

const radii: Record<SurfaceRadius, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
};

export type SurfaceProps = {
  as?: ElementType;
  material: SurfaceMaterial;
  radius?: SurfaceRadius;
} & Omit<ComponentPropsWithoutRef<'div'>, 'color'>;

// The primitive every container is built from: Card, HeroBand, KpiTile, menus, dialogs, tables.
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
