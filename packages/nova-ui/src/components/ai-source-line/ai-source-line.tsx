import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Chip } from '../chip/chip';

export type AiConfidence = 'high' | 'medium' | 'low';

export const AI_CONFIDENCE_LABELS: Readonly<Record<AiConfidence, string>> = {
  high: 'Confidence high',
  medium: 'Confidence medium',
  low: 'Low confidence — read it yourself',
};

export interface AiSourceLineProps
  extends Omit<HTMLAttributes<HTMLParagraphElement>, 'children'> {
  // Where the output came from: "214 summaries sampled", "Theatre log · anaesthesia chart".
  children: ReactNode;
  // The word before it, "Source" by default.
  label?: string;
  // How sure the model is. Shown as an icon and words, never colour alone; low is the explicit
  // "read it yourself" warning, because a shaky value has to be checked, not skimmed.
  confidence?: AiConfidence;
  confidenceLabels?: Partial<Record<AiConfidence, string>>;
  // The event the output was drawn from: a link with eventHref, or a button with onEventClick.
  eventHref?: string;
  onEventClick?: () => void;
  eventLabel?: string;
  // The language of the content (te, hi, en), set on the content only, so the fixed English words
  // keep their own pronunciation.
  contentLang?: string;
}

const glyph = {
  viewBox: '0 0 12 12',
  'aria-hidden': true,
  focusable: false,
  className: 'size-3 shrink-0',
} as const;

// A different shape per level, so the level survives greyscale and colour blindness: a full disc,
// a half disc, a warning triangle.
function ConfidenceIcon({ level }: { level: AiConfidence }) {
  if (level === 'high') {
    return (
      <svg {...glyph}>
        <circle cx="6" cy="6" r="5" fill="currentColor" />
      </svg>
    );
  }
  if (level === 'medium') {
    return (
      <svg {...glyph}>
        <circle
          cx="6"
          cy="6"
          r="4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M6 1.5a4.5 4.5 0 0 1 0 9z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...glyph}>
      <path
        d="M6 1.25 11 10.5H1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6 5v2.25M6 9v.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const eventLink = cx(
  'cursor-pointer rounded-sm font-semibold underline underline-offset-2',
  focusRing,
);

// The prototype's .ai-src: one line of provenance at 11.5px in the AI ink, turning green inside an
// approved block (the block's data-approved, as .ai-block.is-approved .ai-src does).
export function AiSourceLine({
  children,
  label = 'Source',
  confidence,
  confidenceLabels,
  eventHref,
  onEventClick,
  eventLabel = 'From event',
  contentLang,
  className,
  ...rest
}: AiSourceLineProps) {
  const words = { ...AI_CONFIDENCE_LABELS, ...confidenceLabels };
  return (
    <p
      className={cx(
        'text-[11.5px] text-ai-deep in-data-[approved=true]:text-good-deep',
        className,
      )}
      {...rest}
    >
      <span>{label}:</span> <span lang={contentLang}>{children}</span>
      {confidence === 'high' || confidence === 'medium' ? (
        <>
          {' · '}
          <span
            data-confidence={confidence}
            className="inline-flex items-center gap-1 align-middle"
          >
            <ConfidenceIcon level={confidence} />
            {words[confidence]}
          </span>
        </>
      ) : null}
      {eventHref ? (
        <>
          {' · '}
          <a href={eventHref} className={eventLink}>
            {eventLabel}
          </a>
        </>
      ) : onEventClick ? (
        <>
          {' · '}
          <button
            type="button"
            className={eventLink}
            onClick={() => onEventClick()}
          >
            {eventLabel}
          </button>
        </>
      ) : null}
      {confidence === 'low' ? (
        <>
          {' '}
          <Chip
            tone="warn"
            data-confidence="low"
            icon={<ConfidenceIcon level="low" />}
            className="align-middle"
          >
            {words.low}
          </Chip>
        </>
      ) : null}
    </p>
  );
}
