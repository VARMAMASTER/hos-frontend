import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { useControllableState } from '../../primitives/use-controllable-state';
import { Button } from '../button/button';

export interface WhyTrailProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  // The evidence behind one drafted line, one reason per item.
  reasons: ReactNode[];
  // What it was drawn from: "IPD discharge summary · Orthopaedics OPD roster".
  sources?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  // The fixed words, so they can be translated.
  toggleLabel?: string;
  sourcesLabel?: string;
  // The language of the reasons and sources (te, hi, en).
  contentLang?: string;
}

// The prototype's "Why this?" (sim.css .why-trail): a ghost button that discloses the reasons
// behind an AI line, on the AI wash with a 2px AI rule down its left. A real disclosure: the button
// says whether it is open and names the region it controls.
export function WhyTrail({
  reasons,
  sources,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  toggleLabel = 'Why this?',
  sourcesLabel = 'Sources',
  contentLang,
  className,
  ...rest
}: WhyTrailProps) {
  const ids = useId();
  const toggleId = `${ids}-toggle`;
  const regionId = `${ids}-region`;
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  return (
    <div className={className} {...rest}>
      <Button
        id={toggleId}
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen(!open)}
      >
        {toggleLabel}
      </Button>
      {/* Always in the document, so aria-controls resolves; hidden while closed. It fades in, only
          when motion is welcome. Its 12px ink-2 and 11px ink-3 on the AI wash are proven in
          theme/legibility.ts (AI_TRUST_PAIRINGS) for every hospital brand, in both schemes. */}
      <div
        id={regionId}
        role="region"
        aria-labelledby={toggleId}
        hidden={!open}
        className={cx(
          'mt-s3 rounded-none border-l-emphasis border-ai-line bg-ai-ghost px-s5 py-s4 text-label leading-relaxed text-ink-2',
          'motion-safe:animate-fade-in',
        )}
      >
        <ul lang={contentLang} className="flex flex-col gap-s2">
          {reasons.map((reason, index) => (
            <li key={index} className="relative pl-s5">
              <span
                aria-hidden="true"
                className="absolute left-s3 font-bold text-ai"
              >
                ·
              </span>
              {reason}
            </li>
          ))}
        </ul>
        {sources ? (
          <p className="mt-s3 text-meta leading-relaxed text-ink-3">
            {sourcesLabel}: <span lang={contentLang}>{sources}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
