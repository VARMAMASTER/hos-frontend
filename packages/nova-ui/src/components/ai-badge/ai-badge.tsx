import type { HTMLAttributes } from 'react';
import { AiMark } from '../../primitives/ai-mark';
import { cx } from '../../primitives/cx';
import { Chip } from '../chip/chip';

export type AiBadgeVariant = 'default' | 'glow';

export interface AiBadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  // What the machine produced, in words: "AI draft", "AI summary". The label carries the meaning
  // and the AI mark is only a marker, so AI output is never identified by colour alone.
  label?: string;
  variant?: AiBadgeVariant;
}

// The ai tone of Chip, led by the AI mark (the Care spark) and with an optional glass glow pill.
// AI is its own colour family, not a status colour: the prototype's cyan in HOS Violet, and a hue each hospital
// theme derives (theme/derive.ts), proven distinct from good, warn, crit, info and the brand.
export function AiBadge({
  label = 'AI draft',
  variant = 'default',
  className,
  ...rest
}: AiBadgeProps) {
  return (
    <Chip
      tone="ai"
      data-badge=""
      data-variant={variant !== 'default' ? variant : undefined}
      className={cx(variant === 'glow' && 'nova-ai-badge-pill', className)}
      {...rest}
    >
      <AiMark size="xs" />
      {label}
    </Chip>
  );
}
