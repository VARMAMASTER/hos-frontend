import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { Surface, type SurfaceMaterial } from '../../primitives/surface';

// panel is the default surface and takes the product material (glass or solid). data is for dense
// data (tables, figures): it stays opaque under either material, edged with a 1px soft hairline.
export type CardVariant = 'panel' | 'data';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  // The card responds to a press (it holds a link or button that covers it): it presses to 0.98.
  // The interaction itself still belongs to a real link or button inside it.
  interactive?: boolean;
  // The chosen card of a set: its edge upgrades to 2px primary (theme.css) and nothing else changes.
  // Say what is selected in the markup too (aria-checked, aria-current or the words on the card).
  selected?: boolean;
}

const materials: Record<CardVariant, SurfaceMaterial> = {
  panel: 'surface',
  data: 'data',
};

// The Apple card (docs/design-language/README.md): radius lg, a 1px hairline (the material's own
// rim), padding 20 in each part, no shadow.
export function Card({
  variant = 'panel',
  interactive = false,
  selected = false,
  className,
  ...rest
}: CardProps) {
  return (
    <Surface
      material={materials[variant]}
      data-variant={variant}
      data-interactive={interactive ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}
      className={cx(
        interactive &&
          'cursor-pointer transition-transform duration-150 ease-out motion-reduce:transition-none motion-safe:active:scale-[0.98]',
        className,
      )}
      {...rest}
    />
  );
}

export interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4;
}

export function CardHeader({
  title,
  description,
  actions,
  headingLevel = 2,
}: CardHeaderProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border p-5">
      <div className="flex min-w-0 flex-col gap-1">
        <Heading className="text-headline font-semibold text-ink">
          {title}
        </Heading>
        {description ? (
          <p className="text-callout text-ink-3">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function CardBody({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('p-5', className)} {...rest} />;
}

// A footer row (a total, a meta line, an action): ends pushed apart, divided from the body by a
// hairline.
export function CardFooter({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'flex items-center justify-between gap-2 border-t border-border p-5 text-callout text-ink-2',
        className,
      )}
      {...rest}
    />
  );
}
