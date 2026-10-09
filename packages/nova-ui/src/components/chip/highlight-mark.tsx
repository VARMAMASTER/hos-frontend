import { cx } from '../../primitives/cx';

// The highlight's marker: a five-pointed star, so a highlight chip, tag, announcement or milestone is
// never told apart by colour alone. It is deliberately not the AI's four-pointed spark (the AI mark, the Care spark), which
// only ever marks something a machine wrote. Decorative: the words beside it carry the meaning.
export function HighlightMark({ className }: { className?: string }) {
  return (
    <svg
      data-slot="highlight-mark"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cx('shrink-0', className)}
    >
      <path d="M10 2.2l2.35 4.97 5.45.68-4.02 3.74 1.04 5.39L10 14.33l-4.82 2.65 1.04-5.39L2.2 7.85l5.45-.68z" />
    </svg>
  );
}
