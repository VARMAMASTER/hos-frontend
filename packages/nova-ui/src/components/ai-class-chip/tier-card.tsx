import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import {
  AiClassChip,
  type AiClassChipLabels,
  type AiTier,
} from './ai-class-chip';

export interface TierCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  tier: AiTier;
  // The AI feature: "Discharge Drafter".
  title: ReactNode;
  // What the tier lets it do, in a sentence: "Drafts only. A human always signs."
  description: ReactNode;
  detail?: string;
  // Why a RED feature is blocked.
  reason?: ReactNode;
  labels?: Partial<AiClassChipLabels>;
  headingLevel?: 2 | 3 | 4;
  // The language of the description (te, hi, en).
  contentLang?: string;
}

// The tier rail (the prototype's .tiered: a 3px left edge in the tier's colour) on an opaque card.
const rails: Record<AiTier, string> = {
  green: 'border-l-good',
  amber: 'border-l-warn',
  red: 'border-l-crit',
};

// A tier with its meaning: the spark, the feature, its tier chip, and one line on what the tier
// allows (the prototype's .tier-note, at 12px in ink-2).
export function TierCard({
  tier,
  title,
  description,
  detail,
  reason,
  labels,
  headingLevel = 3,
  contentLang,
  className,
  ...rest
}: TierCardProps) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;
  return (
    <div
      role="group"
      aria-labelledby={titleId}
      data-tier={tier}
      className={cx(
        'rounded-card border border-l-rail border-border bg-surface p-s5',
        rails[tier],
        className,
      )}
      {...rest}
    >
      <div className="flex flex-wrap items-center gap-s3">
        <span aria-hidden="true" className="nova-ai-spark">
          ✦
        </span>
        <Heading
          id={titleId}
          className="font-display text-input font-bold text-ink"
        >
          {title}
        </Heading>
        <AiClassChip
          tier={tier}
          detail={detail}
          reason={reason}
          labels={labels}
        />
      </div>
      <p lang={contentLang} className="mt-s3 text-label text-ink-2">
        {description}
      </p>
    </div>
  );
}
