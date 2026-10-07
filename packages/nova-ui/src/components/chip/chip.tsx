import {
  Children,
  isValidElement,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import { HighlightMark } from './highlight-mark';

export type ChipTone = 'neutral' | 'good' | 'warn' | 'crit' | 'info' | 'ai';

// The word every tone is shown with, wherever a tone appears (a timeline event, a feed row, a KPI's
// sentiment). Severity is never carried by colour alone; neutral says nothing.
export const TONE_WORDS: Readonly<Record<ChipTone, string | null>> = {
  neutral: null,
  good: 'Good',
  warn: 'Warning',
  crit: 'Critical',
  info: 'Info',
  ai: 'AI',
};

// A chip's look: a status tone, or the highlight, which is emphasis ("New", "Featured") and not a
// status, so it has no tone word and is not a ChipTone the timeline or the feed can carry.
export type ChipStyleTone = ChipTone | 'highlight';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipStyleTone;
  // A leading glyph, hidden from assistive technology: the chip's text carries the meaning.
  icon?: ReactNode;
  // A leading avatar or photo. It is not hidden, so a named image is still announced.
  avatar?: ReactNode;
  // A selected chip shows a tick and says so; it is never marked by colour alone.
  selected?: boolean;
  // Giving it makes an input chip (a value the user has entered): a remove button, and Backspace or
  // Delete on the focused chip removes it as well.
  onRemove?: () => void;
  // The remove button's accessible name, "Remove <text>" by default. Needed when the chip's content
  // is not plain text.
  removeLabel?: string;
}

const tones: Record<ChipStyleTone, string> = {
  neutral: 'border border-border bg-surface-2 text-ink-2',
  good: 'bg-good-soft text-good-deep',
  warn: 'bg-warn-soft text-warn-deep',
  crit: 'bg-crit-soft text-crit-deep',
  info: 'bg-info-soft text-info-deep',
  ai: 'border border-ai-line bg-ai-soft text-ai-deep',
  // The highlight wash (the brand's tint into the highlight's) under the deep highlight ink, with
  // the star marker unless the chip brings its own icon.
  highlight: 'nova-highlight-wash text-highlight-deep',
};

// The text of a chip's content, for naming its remove button and its group.
function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return String(child);
      }
      return isValidElement<{ children?: ReactNode }>(child)
        ? textOf(child.props.children)
        : '';
    })
    .join('')
    .trim();
}

const glyph = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

// The prototype's .chip, in tokens only: the caption type role (11.5px) semibold, the chip corner (a
// pill), the chip padding (px-chip by py-chip, 8px by 2px) and gap-chip (6px) between its parts,
// never wrapping (.chip-neutral and .chip-ai add their hairline edge). A toned chip keeps
// the accessible -soft / -deep pair and always carries a word (or an icon), never colour alone.
// It can lead with an icon or an avatar, show it is selected (a tick and a spoken word), and become
// an input chip with a remove button. It is a non-interactive span unless it is removable.
export function Chip({
  tone = 'neutral',
  icon,
  avatar,
  selected = false,
  onRemove,
  removeLabel,
  className,
  children,
  onKeyDown,
  ...rest
}: ChipProps) {
  const removable = onRemove !== undefined;
  const name = textOf(children);
  const leading =
    icon ?? (tone === 'highlight' ? <HighlightMark /> : undefined);

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || !removable) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      onRemove();
    }
  }

  return (
    <span
      data-tone={tone}
      data-selected={selected ? 'true' : undefined}
      // A removable chip is one tab stop, a labelled group that Backspace and Delete act on; its
      // remove button is for the pointer and for assistive technology's own commands.
      role={removable ? 'group' : undefined}
      aria-label={
        removable ? `${name}${selected ? ', selected' : ''}` : undefined
      }
      tabIndex={removable ? 0 : undefined}
      className={cx(
        'inline-flex items-center gap-chip whitespace-nowrap rounded-chip px-chip py-chip text-caption font-semibold',
        tones[tone],
        selected && 'ring-hairline ring-inset ring-primary',
        removable && cx('cursor-default', focusRing),
        className,
      )}
      {...rest}
      onKeyDown={handleKeyDown}
    >
      {avatar ? (
        <span
          data-slot="avatar"
          className="-ml-s1 inline-flex shrink-0 items-center"
        >
          {avatar}
        </span>
      ) : null}
      {selected ? (
        <svg {...glyph} className="size-icon-xs shrink-0">
          <path d="M4.5 10.5l3.5 3.5 7.5-8" />
        </svg>
      ) : leading ? (
        <span
          aria-hidden="true"
          data-slot="icon"
          className="inline-flex shrink-0 items-center [&_svg]:size-icon-xs"
        >
          {leading}
        </span>
      ) : null}
      {children}
      {selected && !removable ? (
        <VisuallyHidden>, selected</VisuallyHidden>
      ) : null}
      {removable ? (
        <button
          type="button"
          // The chip is the tab stop; this stays out of the Tab order so one chip is one stop.
          tabIndex={-1}
          aria-label={removeLabel ?? `Remove ${name}`}
          onClick={() => onRemove()}
          className={cx(
            // A 24px target (WCAG 2.5.8: size-touch-sm), pulled into the chip's padding so the chip
            // stays compact.
            '-my-s0 -mr-s1 inline-flex size-touch-sm shrink-0 cursor-pointer items-center justify-center rounded-full',
            'motion-safe:transition-colors hover:bg-ink/10',
            focusRing,
          )}
        >
          <svg {...glyph} className="size-icon-xs">
            <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
          </svg>
        </button>
      ) : null}
    </span>
  );
}
