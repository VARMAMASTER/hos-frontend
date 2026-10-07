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

// The prototype card (.card): the card corner (--r-md, 12px), a hairline --line edge, --shadow-sm.
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
      radius="card"
      data-variant={variant}
      data-interactive={interactive ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}
      className={cx(
        interactive &&
          'cursor-pointer transition-[transform,box-shadow,border-color] duration-fast ease-standard motion-reduce:transition-none hover:border-border-strong motion-safe:hover:-translate-y-s0',
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

// The prototype's .card-h: one row (px-card by py-card-bar, 16px by 12px, gap-card between its
// parts), a hairline below and a whisper of top-lit tint. The title is the prototype's h2 (the title
// role) or h3 (the body role), each with its tracking, the description its .tiny small print (the
// label role) beside it, and the actions sit at the far end, --space-4 apart (.card-h-act).
const headings = {
  2: 'text-title font-semibold tracking-h2',
  3: 'text-body font-semibold tracking-h3',
  4: 'text-body font-semibold tracking-h3',
} as const;

export function CardHeader({
  title,
  description,
  actions,
  headingLevel = 2,
}: CardHeaderProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className="nova-card-head flex items-center justify-between gap-card border-b border-border px-card py-card-bar">
      <Heading
        className={cx('min-w-0 font-display text-ink', headings[headingLevel])}
      >
        {title}
      </Heading>
      {description ? (
        <p className="min-w-0 text-label text-ink-2">{description}</p>
      ) : null}
      {actions ? (
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-s4">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

// The prototype's .card-b: the card padding (--space-6, 16px).
export function CardBody({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('p-card', className)} {...rest} />;
}

// A footer row (a total, a meta line, an action): ends pushed apart, divided from the body by a
// hairline, on the header's bar padding, in the prototype's 13px secondary text (the control role:
// the dense UI text of rows).
export function CardFooter({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'flex items-center justify-between gap-s3 border-t border-border px-card py-card-bar text-control text-ink-2',
        className,
      )}
      {...rest}
    />
  );
}
