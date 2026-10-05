import type { ElementType, HTMLAttributes } from 'react';
import { cx } from './cx';

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  // The element to render: a span by default, a div for block content such as a table.
  as?: ElementType;
}

// Text a screen reader announces but the eye does not see: field labels for icon-only controls,
// the word behind a trend arrow, a chart's data table.
export function VisuallyHidden({
  as: Element = 'span',
  className,
  ...rest
}: VisuallyHiddenProps) {
  return <Element className={cx('sr-only', className)} {...rest} />;
}
