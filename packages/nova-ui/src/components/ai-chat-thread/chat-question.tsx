import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { VisuallyHidden } from '../../primitives/visually-hidden';

export interface ChatQuestionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  // Read before the question by a screen reader, so each turn says who spoke. Translatable.
  speakerLabel?: string;
  // The language the question was asked in (te, hi, en …).
  lang?: string;
}

// The person's turn: the prototype's .aichat-q, a right-aligned bubble in the brand tint (brand
// strong ink on brand soft, the ghost-button pairing the legibility proof already holds), 13px medium,
// padded 8px by 12px, at most 88% of the thread wide. The prototype tucks one corner to 3px; Nova's
// radius grammar has no per-corner radius, so all four corners are the 12px md radius.
export function ChatQuestion({
  children,
  speakerLabel = 'You said',
  lang,
  className,
  ...rest
}: ChatQuestionProps) {
  return (
    <div
      data-chat-turn="question"
      className={cx(
        'my-1.5 ml-auto w-fit max-w-[88%] rounded-md bg-primary-soft px-3 py-2 text-[13px] font-medium text-primary-strong',
        className,
      )}
      {...rest}
    >
      <VisuallyHidden>{`${speakerLabel}:`}</VisuallyHidden>{' '}
      <span lang={lang} className="whitespace-pre-wrap break-words">
        {children}
      </span>
    </div>
  );
}
