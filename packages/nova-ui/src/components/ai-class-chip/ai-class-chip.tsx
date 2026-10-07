import { useId, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { Button } from '../button/button';
import { Chip, type ChipTone } from '../chip/chip';

// The regulatory class of an AI feature (ADR #7, the CDSCO SaMD framework): GREEN is productivity
// (drafts a human signs), AMBER quotes references and never tells a clinician what to do, RED is a
// medical device that HOS is not licensed to run, so it can never be switched on.
export type AiTier = 'green' | 'amber' | 'red';

export const AI_TIERS: readonly AiTier[] = ['green', 'amber', 'red'];

export interface AiClassChipLabels {
  green: string;
  amber: string;
  red: string;
  whyBlocked: string;
}

export const AI_CLASS_CHIP_LABELS: Readonly<AiClassChipLabels> = {
  green: 'Tier: green',
  amber: 'Tier: amber',
  red: 'Tier: red',
  whyBlocked: 'Why blocked',
};

// A tier is a risk class, not a status, but it borrows the status tones it resembles, and always
// says its name: the colour is never the only signal.
export const TIER_TONES: Readonly<Record<AiTier, ChipTone>> = {
  green: 'good',
  amber: 'warn',
  red: 'crit',
};

export interface AiClassChipProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  tier: AiTier;
  // What the class is for, after the tier: "productivity", "medical device".
  detail?: string;
  // Why a RED feature is blocked ("CDSCO Class C licence required"). Reached from a "Why blocked"
  // disclosure, and it describes the chip.
  reason?: ReactNode;
  labels?: Partial<AiClassChipLabels>;
}

const glyph = {
  viewBox: '0 0 20 20',
  fill: 'currentColor',
  'aria-hidden': true,
  focusable: false,
} as const;

// One shape per tier, so it reads in greyscale and at 12px: a disc, a triangle, a diamond (an
// octagon was tried and reads as a disc at chip size).
function TierIcon({ tier }: { tier: AiTier }) {
  if (tier === 'green') {
    return (
      <svg {...glyph}>
        <circle cx="10" cy="10" r="7" />
      </svg>
    );
  }
  if (tier === 'amber') {
    return (
      <svg {...glyph}>
        <path d="M10 2.5 18 17H2z" />
      </svg>
    );
  }
  return (
    <svg {...glyph}>
      <path d="M10 1.5 18.5 10 10 18.5 1.5 10z" />
    </svg>
  );
}

// The tier chip that sits beside AI output (the prototype's "GREEN · productivity" chips in the
// fleet table and the tier notes in the doctor's workspace). It is never a control. A RED chip is
// aria-disabled, because nothing in HOS turns a RED feature on, and it can explain why.
export function AiClassChip({
  tier,
  detail,
  reason,
  labels,
  className,
  ...rest
}: AiClassChipProps) {
  const words = { ...AI_CLASS_CHIP_LABELS, ...labels };
  const ids = useId();
  const reasonId = `${ids}-reason`;
  const [open, setOpen] = useState(false);
  const explains = tier === 'red' && reason !== undefined && reason !== null;

  return (
    <span
      className={cx('inline-flex flex-col items-start gap-s2', className)}
      {...rest}
    >
      <span className="inline-flex flex-wrap items-center gap-s3">
        <Chip
          tone={TIER_TONES[tier]}
          data-tier={tier}
          icon={<TierIcon tier={tier} />}
          aria-disabled={tier === 'red' ? 'true' : undefined}
          aria-describedby={explains ? reasonId : undefined}
        >
          {detail ? `${words[tier]} · ${detail}` : words[tier]}
        </Chip>
        {explains ? (
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={open}
            aria-controls={reasonId}
            onClick={() => setOpen(!open)}
          >
            {words.whyBlocked}
          </Button>
        ) : null}
      </span>
      {explains ? (
        <span
          id={reasonId}
          hidden={!open}
          className="text-label text-crit-deep motion-safe:animate-fade-in"
        >
          {reason}
        </span>
      ) : null}
    </span>
  );
}
