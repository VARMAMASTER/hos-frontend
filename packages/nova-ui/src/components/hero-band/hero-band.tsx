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

// The page-top band: the prototype's .page-head.glass-hero. White text on the violet-to-sky glass
// (nova-hero), whose sky glow stop is the hospital's own highlight on the chrome (chrome-glow-2,
// derived per brand and never lighter there than the prototype's, so the text proof holds). 20px by
// 24px of padding (py-s7, px-s8), the hero corner, the title as the prototype h1 (text-display,
// 23px semibold) and the description at 13px (text-control) in the hero's secondary ink, which material.spec.ts proves at 4.5:1 at the gradient's light
// end. The actions sit at the bottom right.
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
    <Surface
      material="hero"
      radius="hero"
      className={cx('px-s8 py-s7', className)}
      {...rest}
    >
      <div className="flex flex-wrap items-end justify-between gap-s6">
        <div className="min-w-0">
          <Heading className="font-display text-display font-semibold tracking-h1">
            {title}
          </Heading>
          {description ? (
            <p className="mt-s0 text-control text-(color:--nova-hero-ink-2)">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-s4">
            {actions}
          </div>
        ) : null}
      </div>
      {children ? <div className="mt-s7">{children}</div> : null}
    </Surface>
  );
}
