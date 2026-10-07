import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { Card } from '../card/card';

export interface EmptyStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  // Usually a Button: the one thing that would fill the space.
  action?: ReactNode;
  // Decoration only: the title already says what is missing.
  icon?: ReactNode;
  // Defaults to 3, since an empty state normally sits inside a section that has its own heading.
  headingLevel?: 2 | 3 | 4;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  headingLevel = 3,
  className,
  ...rest
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <Card
      className={cx(
        'flex flex-col items-center gap-s5 px-s8 py-s10 text-center',
        className,
      )}
      {...rest}
    >
      {icon ? (
        <div aria-hidden="true" className="text-ink-3 [&_svg]:size-empty-icon">
          {icon}
        </div>
      ) : null}
      <Heading className="font-display text-title font-semibold tracking-h2 text-ink">
        {title}
      </Heading>
      {description ? (
        <p className="max-w-xs text-control text-ink-2">{description}</p>
      ) : null}
      {action ? <div className="mt-s3">{action}</div> : null}
    </Card>
  );
}
