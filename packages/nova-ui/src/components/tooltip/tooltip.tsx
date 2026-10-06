import {
  cloneElement,
  useEffect,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { Surface } from '../../primitives/surface';

export type TooltipPlacement = 'top' | 'bottom';

export interface TooltipProps {
  content: ReactNode;
  // The trigger: one focusable element that accepts aria-describedby (a Button, a link, an input).
  // A tooltip on something a keyboard cannot reach would be a tooltip only mouse users get.
  children: ReactElement<{ 'aria-describedby'?: string }>;
  placement?: TooltipPlacement;
  // Styles the wrapper around the trigger.
  className?: string;
}

// WCAG 1.4.13 (content on hover or focus) is the spec here: it appears on hover and on focus,
// Escape dismisses it without moving the pointer or the focus, the pointer can travel onto it
// without it closing, and it stays until one of those happens. Positioning is plain CSS around
// the trigger, so it does not flip near a viewport edge.
export function Tooltip({
  content,
  children,
  placement = 'top',
  className,
}: TooltipProps) {
  const tooltipId = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Set by Escape and cleared the next time the trigger is hovered or focused.
  const [dismissed, setDismissed] = useState(false);
  const visible = (hovered || focused) && !dismissed;

  useEffect(() => {
    if (!visible) return undefined;
    // Escape may come while focus is elsewhere (the tooltip was opened by hover), so listen on the
    // document. The capture phase puts this ahead of an enclosing dialog or menu: one press
    // dismisses the tooltip only, and a second press reaches them.
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setDismissed(true);
    };
    document.addEventListener('keydown', dismiss, true);
    return () => document.removeEventListener('keydown', dismiss, true);
  }, [visible]);

  const ownDescription = children.props['aria-describedby'];
  const describedBy = cx(ownDescription, visible && tooltipId) || undefined;

  // The handlers sit on the wrapper, which contains the tooltip too. Moving the pointer from the
  // trigger onto the tooltip therefore never leaves the wrapper, and focus events from the
  // trigger bubble up to it.
  return (
    <span
      className={cx('relative inline-flex', className)}
      onMouseEnter={() => {
        setHovered(true);
        setDismissed(false);
      }}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => {
        setFocused(true);
        setDismissed(false);
      }}
      onBlur={() => setFocused(false)}
    >
      {cloneElement(children, { 'aria-describedby': describedBy })}
      {visible ? (
        // Padding, not a margin, holds the tooltip off the trigger: a margin would be a gap the
        // pointer falls through on its way to the tooltip.
        <span
          id={tooltipId}
          role="tooltip"
          data-placement={placement}
          className={cx(
            'absolute left-1/2 z-50 -translate-x-1/2',
            placement === 'top' ? 'bottom-full pb-2' : 'top-full pt-2',
          )}
        >
          <Surface
            as="span"
            material="overlay"
            radius="md"
            className="block w-max max-w-xs px-3 py-2 text-caption text-ink"
          >
            {content}
          </Surface>
        </span>
      ) : null}
    </span>
  );
}
