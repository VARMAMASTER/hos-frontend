import { useId, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import {
  AiDraftBlock,
  type AiDraftBlockProps,
  type AiDraftStatus,
} from '../ai-draft-block/ai-draft-block';
import { StreamCaret } from '../ambient-scribe-recorder/stream-caret';
import { Button } from '../button/button';
import { Chip, type ChipTone } from '../chip/chip';
import { Textarea } from '../textarea/textarea';

export type SoapKey = 'subjective' | 'objective' | 'assessment' | 'plan';

export const SOAP_KEYS: readonly SoapKey[] = [
  'subjective',
  'objective',
  'assessment',
  'plan',
];

// Where a section's words came from, said on the section:
// - verbatim: transcribed as spoken (S and O, by default).
// - your-words: the clinician's own assessment, restated (A, and a dictated P).
// - dictate: the plan, empty until the clinician speaks it.
export type SoapProvenance = 'verbatim' | 'your-words' | 'dictate';

export interface SoapSection {
  // The section in the language it was spoken in.
  text: string;
  // An English gloss under it, when the text is in another language.
  gloss?: string;
  // The language of the text (te, hi, en) and of the gloss (en by default).
  lang?: string;
  glossLang?: string;
  provenance?: SoapProvenance;
}

export type SoapSections = Partial<Record<SoapKey, SoapSection>>;

export interface SoapDraftBlockLabels {
  headings: Record<SoapKey, string>;
  provenance: Record<SoapProvenance, string>;
  planBlocked: string;
  planBlockedReason: string;
  planEmpty: string;
  planPlaceholder: string;
  dictatePlan: string;
}

export const SOAP_DRAFT_BLOCK_LABELS: Readonly<SoapDraftBlockLabels> = {
  headings: {
    subjective: 'S — Subjective',
    objective: 'O — Objective',
    assessment: 'A — Assessment',
    plan: 'P — Plan',
  },
  provenance: {
    verbatim: 'transcribed verbatim',
    'your-words': 'your words',
    dictate: 'yours to dictate',
  },
  planBlocked: 'Blocked — no plan dictated yet',
  planBlockedReason:
    'The Scribe does not write a plan; it transcribes the one you speak. The note cannot be signed until it does.',
  planEmpty: 'No plan dictated yet.',
  planPlaceholder: 'What you dictate appears here',
  dictatePlan: 'Dictate the plan',
};

export type SoapDraftBlockLabelOverrides = Partial<
  Omit<SoapDraftBlockLabels, 'headings' | 'provenance'>
> & {
  headings?: Partial<Record<SoapKey, string>>;
  provenance?: Partial<Record<SoapProvenance, string>>;
};

export interface SoapDraftBlockProps
  extends Omit<AiDraftBlockProps, 'title' | 'children'> {
  // "AI SOAP draft" by default.
  title?: ReactNode;
  // The note, section by section: controlled with sections, or starting from defaultSections.
  sections?: SoapSections;
  defaultSections?: SoapSections;
  onSectionsChange?: (sections: SoapSections) => void;
  // While generating: how many sections have arrived (S, then O, A and P). All four by default.
  revealed?: number;
  // Blocked on the plan: the control that starts the dictation (the app records it).
  onDictatePlan?: () => void;
  soapLabels?: SoapDraftBlockLabelOverrides;
}

const DEFAULT_PROVENANCE: Record<Exclude<SoapKey, 'plan'>, SoapProvenance> = {
  subjective: 'verbatim',
  objective: 'verbatim',
  assessment: 'your-words',
};

const PROVENANCE_TONES: Record<SoapProvenance, ChipTone> = {
  verbatim: 'neutral',
  'your-words': 'neutral',
  dictate: 'warn',
};

// Statuses in which the draft may still be changed by the clinician.
const EDITABLE: readonly AiDraftStatus[] = [
  'pending',
  'undone',
  'blocked',
  'for-signature',
  'witness',
  'gated',
];

const warnIcon = (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className="mt-s0 size-icon-sm shrink-0"
  >
    <path d="M10 2.75 18 16.5H2z" />
    <path d="M10 8v3.5M10 14v.01" />
  </svg>
);

const micIcon = (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
    className="size-icon-sm"
  >
    <rect x="7" y="2.5" width="6" height="10" rx="3" />
    <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5" />
  </svg>
);

// The prototype's AI SOAP draft (03-doctor.html, the scribe draft; .soap-grid, .soap-sec): four
// sections in two columns, each in the language it was spoken in with an English gloss under it,
// and a chip that says where its words came from. The plan is never drafted: a drafted plan would be
// the software proposing treatment. It stays empty and flagged until the clinician dictates it, and
// until then the note is blocked and cannot be approved, whatever status the caller holds.
export function SoapDraftBlock({
  title = 'AI SOAP draft',
  sections: sectionsProp,
  defaultSections = {},
  onSectionsChange,
  revealed,
  onDictatePlan,
  soapLabels,
  status: statusProp,
  defaultStatus = 'pending',
  onStatusChange,
  blockedReason,
  headingLevel = 3,
  actions,
  labels,
  ...rest
}: SoapDraftBlockProps) {
  const words: SoapDraftBlockLabels = {
    ...SOAP_DRAFT_BLOCK_LABELS,
    ...soapLabels,
    headings: { ...SOAP_DRAFT_BLOCK_LABELS.headings, ...soapLabels?.headings },
    provenance: {
      ...SOAP_DRAFT_BLOCK_LABELS.provenance,
      ...soapLabels?.provenance,
    },
  };
  const ids = useId();
  const [sections, setSections] = useControllableState({
    value: sectionsProp,
    defaultValue: defaultSections,
    onChange: onSectionsChange,
  });
  const [status, setStatus] = useControllableState({
    value: statusProp,
    defaultValue: defaultStatus,
    onChange: onStatusChange,
  });

  const planEmpty = !(sections.plan?.text ?? '').trim();
  // The clinical-safety rule: no plan, no approval. Only a draft still being written or one already
  // rejected keeps its own status.
  const planBlocked =
    planEmpty && status !== 'generating' && status !== 'rejected';
  const effective: AiDraftStatus = planBlocked ? 'blocked' : status;
  const generating = effective === 'generating';
  const editable = EDITABLE.includes(effective);

  const count = generating
    ? Math.min(SOAP_KEYS.length, Math.max(0, Math.floor(revealed ?? 4)))
    : SOAP_KEYS.length;
  const shown = SOAP_KEYS.slice(0, count);
  const Heading = `h${Math.min(6, headingLevel + 1)}` as 'h4' | 'h5' | 'h6';

  function edit(key: SoapKey, text: string) {
    setSections({ ...sections, [key]: { ...sections[key], text } });
  }

  return (
    <AiDraftBlock
      title={title}
      headingLevel={headingLevel}
      status={effective}
      onStatusChange={(next) => setStatus(next)}
      blockedReason={planBlocked ? words.planBlockedReason : blockedReason}
      labels={planBlocked ? { ...labels, blocked: words.planBlocked } : labels}
      actions={
        planBlocked && onDictatePlan ? (
          <>
            <Button variant="ai" size="sm" onClick={() => onDictatePlan()}>
              {micIcon}
              {words.dictatePlan}
            </Button>
            {actions}
          </>
        ) : (
          actions
        )
      }
      {...rest}
    >
      {/* .soap-grid: two columns, 12px apart, one under 760px. */}
      <div className="grid gap-s5 md:grid-cols-2">
        {shown.map((key, index) => {
          const content = sections[key];
          const text = content?.text ?? '';
          const flagged = key === 'plan' && planEmpty && !generating;
          const provenance: SoapProvenance =
            content?.provenance ??
            (key === 'plan'
              ? planEmpty
                ? 'dictate'
                : 'your-words'
              : DEFAULT_PROVENANCE[key]);
          const headingId = `${ids}-${key}`;
          const glossId = `${ids}-${key}-gloss`;
          const newest = generating && index === shown.length - 1;
          return (
            // .soap-sec: a lighter panel on the AI wash, with the AI line as its edge; the empty plan
            // takes the warning edge as well as its words.
            <div
              key={key}
              data-section={key}
              data-flagged={flagged ? 'true' : undefined}
              className={cx(
                'flex flex-col rounded-control border bg-surface/55 px-s5 py-s4',
                flagged ? 'border-warn' : 'border-ai-line',
                generating && 'motion-safe:animate-fade-in',
              )}
            >
              <div className="mb-s2 flex flex-wrap items-center gap-s3">
                <Heading
                  id={headingId}
                  className="font-display text-label font-bold uppercase tracking-label text-ai-deep"
                >
                  {words.headings[key]}
                </Heading>
                <Chip tone={PROVENANCE_TONES[provenance]}>
                  {words.provenance[provenance]}
                </Chip>
              </div>
              {flagged ? (
                <p className="mb-s1 flex items-start gap-s2 text-body-sm font-semibold text-warn-deep">
                  {warnIcon}
                  {words.planEmpty}
                </p>
              ) : null}
              {editable ? (
                <Textarea
                  label={<VisuallyHidden>{words.headings[key]}</VisuallyHidden>}
                  lang={content?.lang}
                  value={text}
                  placeholder={
                    key === 'plan' ? words.planPlaceholder : undefined
                  }
                  aria-describedby={content?.gloss ? glossId : undefined}
                  onChange={(event) => edit(key, event.target.value)}
                />
              ) : text ? (
                <p lang={content?.lang} className="mb-s1 text-control text-ink">
                  {text}
                  {newest ? <StreamCaret /> : null}
                </p>
              ) : newest ? (
                <p className="mb-s1 text-control text-ink">
                  <StreamCaret />
                </p>
              ) : null}
              {content?.gloss ? (
                <p
                  id={glossId}
                  lang={content.glossLang ?? 'en'}
                  className={cx('text-body-sm text-ink-2', editable && 'mt-s1')}
                >
                  {content.gloss}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </AiDraftBlock>
  );
}
