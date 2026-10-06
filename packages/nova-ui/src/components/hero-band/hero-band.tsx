import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { Surface } from '../../primitives/surface';

// `title` is a ReactNode here, but React types the HTML attribute as a string.
export interface HeroBandProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 1 | 2;
}

// The page-top band. Its text is white on the brand gradient (nova-hero). The description stays
// full-strength white — a dimmed white fails 4.5:1 at the gradient's light end — and takes its
// lower rank from size and weight instead. An ink token would sit dark on the brand.
export function HeroBand({
  title,
  description,
  actions,
  headingLevel = 1,
  className,
  children,
  ...rest
}: HeroBandProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <Surface material="hero" className={cx('p-6 md:p-8', className)} {...rest}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Heading className="text-title3 font-semibold">{title}</Heading>
          {description ? (
            <p className="mt-2 text-body font-normal text-on-primary">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </Surface>
  );
}
