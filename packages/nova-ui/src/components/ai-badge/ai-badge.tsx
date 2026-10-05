import type { HTMLAttributes } from 'react';
import { Chip } from '../chip/chip';

export interface AiBadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  // What the machine produced, in words: "AI draft", "AI summary". The label carries the meaning
  // and the spark is only a marker, so AI output is never identified by colour alone.
  label?: string;
}

// The ai tone of Chip, so the badge can never drift from the rest of the ai colour. AI is cyan,
// not a status colour: it stays distinct from good, warn, crit and info in every hospital theme.
export function AiBadge({ label = 'AI draft', ...rest }: AiBadgeProps) {
  return (
    <Chip tone="ai" data-badge="" {...rest}>
      <span aria-hidden="true">✦</span>
      {label}
    </Chip>
  );
}
