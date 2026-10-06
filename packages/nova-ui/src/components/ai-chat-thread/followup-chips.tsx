import type { HTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';

export interface FollowupChipsProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect' | 'children'> {
  // The questions, already phrased (the caller's text, in the caller's language).
  questions: readonly string[];
  onSelect: (question: string) => void;
  // The group's accessible name. Translatable.
  label?: string;
  // While HOS AI is answering, nothing new can be asked.
  disabled?: boolean;
  lang?: string;
}

// A row of suggested questions: the prototype's .aichat-followups / .hcp-sugg, Chip's ai treatment
// (.chip.chip-ai: the deep AI ink on the AI tint, 11.5px semibold, a pill) on real buttons, 6px
// apart. Two things differ from the prototype's chip, both for the hand and the eye: each is at
// least 24px tall (WCAG 2.5.8; the prototype's is 20px), and a long question wraps instead of
// running out of the panel. Hover draws the AI edge.
export function FollowupChips({
  questions,
  onSelect,
  label = 'Suggested questions',
  disabled = false,
  lang,
  className,
  ...rest
}: FollowupChipsProps) {
  if (questions.length === 0) return null;
  return (
    <div
      role="group"
      aria-label={label}
      lang={lang}
      className={cx('flex flex-wrap gap-1.5', className)}
      {...rest}
    >
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(question)}
          className={cx(
            'inline-flex min-h-6 cursor-pointer items-center rounded-full border border-transparent bg-ai-soft px-2 py-0.5 text-left text-[11.5px] font-semibold text-ai-deep',
            'hover:border-ai motion-safe:transition-colors motion-safe:duration-fast motion-safe:ease-standard',
            focusRing,
            'disabled:cursor-default disabled:opacity-50',
          )}
        >
          {question}
        </button>
      ))}
    </div>
  );
}
