import type { HTMLAttributes, ReactNode } from 'react';

// `title` is a ReactNode here, but React types the HTML attribute as a string.
export interface HeroBandProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 1 | 2;
}

// The page-top band. Its text is white on the brand gradient (nova-hero), so the description is a
// dimmed white rather than an ink token, which would sit dark on the brand.
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
    <div
      className={['nova-hero rounded-lg p-6 md:p-8', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Heading className="text-2xl font-semibold">{title}</Heading>
          {description ? (
            <p className="mt-2 text-sm text-on-primary/70">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
