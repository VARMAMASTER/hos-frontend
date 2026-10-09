import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { AiMark } from '../../primitives/ai-mark';
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
  // The header's status, after the badge, in place of the default "Approved" chip (AiDraftBlock's
  // lifecycle chip: "Draft — awaiting approval", "✓ Signed · Dr. … · 10:52").
  status?: ReactNode;
  // The badge's words: "AI draft" while a draft and "AI-assisted" once approved, by default.
  badgeLabel?: string;
  // The title's id, so controls elsewhere ("Approve <title>") can be named by it.
  titleId?: string;
  // The tile's content: the AI mark, or ✓ once approved. The prototype gives some blocks a meaning of their
  // own (₹ on a money gate); it is hidden from assistive technology either way.
  spark?: ReactNode;
}

export function AiPanel({
  title,
  children,
  footer,
  state = 'draft',
  headingLevel = 2,
  status,
  badgeLabel,
  titleId: givenTitleId,
  spark,
  className,
  ...rest
}: AiPanelProps) {
  const ownTitleId = useId();
  const titleId = givenTitleId ?? ownTitleId;
  const Heading = `h${headingLevel}` as const;
  return (
    // A group, not a <section>: a landmark per AI panel would crowd the landmark list. It is the
    // prototype's .ai-block: the near-white AI wash and the gradient rail while it is a draft; once
    // approved it settles to green (theme.css), and says so in words.
    <Surface
      material="ai-block"
      radius="card"
      role="group"
      aria-labelledby={titleId}
      data-state={state}
      data-approved={state === 'approved' ? 'true' : undefined}
      className={className}
      {...rest}
    >
      {/* .ai-block-h: the spark, the title in bold at 13.5px, then the badges, 8px apart. */}
      <div className="mb-s4 flex flex-wrap items-center gap-s3">
        <AiMark
          tile
          symbol={spark ?? (state === 'approved' ? '✓' : undefined)}
        />
        <Heading
          id={titleId}
          className="font-display text-input font-bold text-ink"
        >
          {title}
        </Heading>
        {/* Approved is a draft no longer, but a machine still wrote it: the badge stays, in words. */}
        <AiBadge
          label={badgeLabel ?? (state === 'draft' ? 'AI draft' : 'AI-assisted')}
        />
        {status ??
          (state === 'approved' ? <Chip tone="good">Approved</Chip> : null)}
      </div>
      <div className="text-body text-ink">{children}</div>
      {/* .ai-actions: 12px below the body. */}
      {footer ? <div className="mt-s5">{footer}</div> : null}
    </Surface>
  );
}
