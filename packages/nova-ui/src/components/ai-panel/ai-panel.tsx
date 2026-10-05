import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { Surface } from '../../primitives/surface';
import { AiBadge } from '../ai-badge/ai-badge';
import { Chip } from '../chip/chip';

export type AiPanelState = 'draft' | 'approved';

export interface AiPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  children: ReactNode;
  // Usually an ApprovalBar.
  footer?: ReactNode;
  state?: AiPanelState;
  // Defaults to 2, like CardHeader.
  headingLevel?: 2 | 3 | 4;
}

export function AiPanel({
  title,
  children,
  footer,
  state = 'draft',
  headingLevel = 2,
  className,
  ...rest
}: AiPanelProps) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;
  return (
    // A group, not a <section>: a landmark per AI panel would crowd the landmark list. The ai rail is
    // the draft styling: an approved panel drops it, and says so in words.
    <Surface
      material="surface"
      role="group"
      aria-labelledby={titleId}
      data-state={state}
      className={cx(
        'overflow-hidden',
        state === 'draft' && 'nova-ai-rail',
        className,
      )}
      {...rest}
    >
      <div className="flex items-start justify-between gap-4 px-6 py-4">
        <Heading id={titleId} className="text-base font-semibold text-ink">
          {title}
        </Heading>
        {/* Approved is a draft no longer, but a machine still wrote it: the badge stays, in words. */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <AiBadge label={state === 'draft' ? 'AI draft' : 'AI-assisted'} />
          {state === 'approved' ? <Chip tone="good">Approved</Chip> : null}
        </div>
      </div>
      <div className="px-6 pb-4 text-sm text-ink">{children}</div>
      {footer ? (
        <div className="border-t border-border px-6 py-3">{footer}</div>
      ) : null}
    </Surface>
  );
}
