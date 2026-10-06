import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { Surface, type SurfaceMaterial } from '../../primitives/surface';

// panel is the prototype's .card: an opaque panel under either material, as the prototype keeps
// every card. data adds the prototype's gradient edge (.edge-premium) for dense data and figures.
// glass is the prototype's .glass-panel: it frosts on glass and is the card on solid.
export type CardVariant = 'panel' | 'data' | 'glass';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  // The card responds to a press (it holds a link or button that covers it): on hover its edge
  // strengthens and it lifts 2px to shadow-md, as the prototype's interactive surfaces do. The
  // interaction itself still belongs to a real link or button inside it.
  interactive?: boolean;
  // The chosen card of a set: its edge upgrades to 2px primary (theme.css) and nothing else changes.
  // Say what is selected in the markup too (aria-checked, aria-current or the words on the card).
  selected?: boolean;
}

const materials: Record<CardVariant, SurfaceMaterial> = {
  panel: 'card',
  data: 'data',
  glass: 'surface',
};

const lifts: Record<CardVariant, string> = {
  panel: 'hover:[--nova-surface-lift:var(--nova-shadow-md)]',
  data: 'hover:[--nova-data-lift:var(--nova-shadow-md)]',
  glass: 'hover:[--nova-surface-lift:var(--nova-shadow-md)]',
};

// The prototype card (.card): radius md (12px), a 1px --line edge, --shadow-sm.
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
      radius="md"
      data-variant={variant}
      data-interactive={interactive ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}
      className={cx(
        interactive &&
          'cursor-pointer transition-[transform,box-shadow,border-color] duration-150 ease-out motion-reduce:transition-none hover:border-border-strong motion-safe:hover:-translate-y-0.5',
        interactive && lifts[variant],
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

// The prototype's .card-h: one row, 12px by 16px, a hairline below and a whisper of top-lit tint.
// The title is the prototype's h2 (17px) or h3 (14px), the description its .tiny small print beside
// it, and the actions sit at the far end.
const headings = {
  2: 'text-[17px] font-semibold tracking-h2',
  3: 'text-[14px] font-semibold tracking-h3',
  4: 'text-[14px] font-semibold tracking-h3',
} as const;

export function CardHeader({
  title,
  description,
  actions,
  headingLevel = 2,
}: CardHeaderProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className="nova-card-head flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <Heading
        className={cx('min-w-0 font-display text-ink', headings[headingLevel])}
      >
        {title}
      </Heading>
      {description ? (
        <p className="min-w-0 text-[12px] text-ink-2">{description}</p>
      ) : null}
      {actions ? (
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2.5">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

// The prototype's .card-b: 16px of padding.
export function CardBody({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('p-4', className)} {...rest} />;
}

// A footer row (a total, a meta line, an action): ends pushed apart, divided from the body by a
// hairline, in the prototype's 13px secondary text.
export function CardFooter({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-[13px] text-ink-2',
        className,
      )}
      {...rest}
    />
  );
}
