import { useId, type HTMLAttributes, type ReactNode } from 'react';
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

// The ai rail is the draft styling. An approved panel drops it, and says so in words.
const rails: Record<AiPanelState, string> = {
  draft: 'bg-ai',
  approved: 'bg-border-strong',
};

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
    // A group, not a <section>: a landmark per AI panel would crowd the landmark list.
    <div
      role="group"
      aria-labelledby={titleId}
      data-state={state}
      className={['nova-surface relative overflow-hidden rounded-lg', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {/* A rail element rather than a border, so it cannot fight the material's own border. */}
      <span
        aria-hidden="true"
        data-rail=""
        className={['absolute inset-y-0 left-0 w-1', rails[state]].join(' ')}
      />
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
    </div>
  );
}
