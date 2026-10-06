import { useId, type HTMLAttributes, type ReactNode } from 'react';
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
    // A group, not a <section>: a landmark per AI panel would crowd the landmark list. It is the
    // prototype's .ai-block: the near-white AI wash and the gradient rail while it is a draft; once
    // approved it settles to green (theme.css), and says so in words.
    <Surface
      material="ai-block"
      radius="md"
      role="group"
      aria-labelledby={titleId}
      data-state={state}
      data-approved={state === 'approved' ? 'true' : undefined}
      className={className}
      {...rest}
    >
      {/* .ai-block-h: the spark, the title in bold at 13.5px, then the badges, 8px apart. */}
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <span aria-hidden="true" className="nova-ai-spark">
          {state === 'approved' ? '✓' : '✦'}
        </span>
        <Heading
          id={titleId}
          className="font-display text-[13.5px] font-bold text-ink"
        >
          {title}
        </Heading>
        {/* Approved is a draft no longer, but a machine still wrote it: the badge stays, in words. */}
        <AiBadge label={state === 'draft' ? 'AI draft' : 'AI-assisted'} />
        {state === 'approved' ? <Chip tone="good">Approved</Chip> : null}
      </div>
      <div className="text-[14px] text-ink">{children}</div>
      {/* .ai-actions: 12px below the body. */}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </Surface>
  );
}
