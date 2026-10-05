import type { HTMLAttributes } from 'react';
import { cx } from './cx';

// Text a screen reader announces but the eye does not see: field labels for icon-only controls,
// the word behind a trend arrow, a chart's data table.
export function VisuallyHidden({
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx('sr-only', className)} {...rest} />;
}
