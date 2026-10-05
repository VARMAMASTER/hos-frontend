import type { HTMLAttributes, ReactNode } from 'react';

// panel is the default surface and takes the product material (glass or solid). data is for dense
// data (tables, figures): it stays opaque under either material and carries its richness in a rim.
export type CardVariant = 'panel' | 'data';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

// Whole class names, so Tailwind's scanner finds each utility.
const variants: Record<CardVariant, string> = {
  panel: 'nova-surface',
  data: 'nova-data',
};

export function Card({ variant = 'panel', className, ...rest }: CardProps) {
  return (
    <div
      data-variant={variant}
      className={['rounded-lg', variants[variant], className]
        .filter(Boolean)
        .join(' ')}
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
    <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
      <div className="min-w-0">
        <Heading className="text-base font-semibold text-ink">{title}</Heading>
        {description ? (
          <p className="mt-1 text-sm text-ink-3">{description}</p>
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
  return (
    <div
      className={['px-6 py-4', className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}
