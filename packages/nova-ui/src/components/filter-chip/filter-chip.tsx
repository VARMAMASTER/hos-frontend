import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { disabledControl } from '../../primitives/states';
import { useControllableState } from '../../primitives/use-controllable-state';

export interface FilterChipProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'type' | 'aria-pressed' | 'onChange'
  > {
  // Controlled when given; the chip then only asks, and the parent decides.
  pressed?: boolean;
  defaultPressed?: boolean;
  // A <button> raises no change event, so this reports the new state directly.
  onPressedChange?: (pressed: boolean) => void;
}

// A filter toggle, the prototype's .fchip (02-reception.html): a 12px / 600 chip with a line-strong
// edge on the panel when off, and the brand fill when on. Modern in its motion only: pressing it
// morphs its corners from soft (rounded-control, 8px) to a pill (rounded-filter-on, 18px: the chip is
// ~30px tall, so 18px is the full pill, and unlike 999px the whole transition shows), and a tick slides in
// at the leading edge, the chip growing to fit it. It scales down under the finger. All of it is
// motion-safe, so under reduced motion the state changes instantly. A <button aria-pressed>, so Space
// and Enter toggle it with no key handling here. On also shows a tick: the state never rests on
// colour alone.
export const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(
  function FilterChip(
    {
      pressed,
      defaultPressed = false,
      onPressedChange,
      onClick,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const [isOn, setOn] = useControllableState({
      value: pressed,
      defaultValue: defaultPressed,
      onChange: onPressedChange,
    });

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      // A disabled <button> never reaches here: React drops its clicks.
      if (event.defaultPrevented) return;
      setOn(!isOn);
    }

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={isOn}
        className={cx(
          // .fchip: 1px edge, the label role (12px) / 600, padding 6px 10px: a small control, so the
          // sm control tokens (min-h-control-sm, px-/py-control-sm), as a small Button. The tick takes
          // a 6px gap (--space-2), which its slot cancels while it is collapsed.
          'inline-flex min-h-control-sm items-center gap-s2 border px-control-sm py-control-sm text-label font-semibold',
          'motion-safe:transition-[color,background-color,border-color,border-radius,transform] motion-safe:duration-base motion-safe:ease-standard motion-safe:active:scale-95',
          isOn
            ? 'rounded-filter-on border-primary bg-primary text-on-primary'
            : 'rounded-control border-border-strong bg-surface text-ink-2 hover:border-primary hover:text-primary-strong',
          focusRing,
          disabledControl,
          className,
        )}
        {...rest}
        onClick={handleClick}
      >
        {/* The tick slot is always there: collapsed and faded off, open and in when on. */}
        <span
          aria-hidden="true"
          data-state={isOn ? 'on' : 'off'}
          className={cx(
            'inline-flex shrink-0 overflow-hidden motion-safe:transition-[max-width,margin,opacity,transform] motion-safe:duration-base motion-safe:ease-standard',
            isOn
              ? 'mr-0 max-w-s6 translate-x-0 opacity-100'
              : '-mr-s2 max-w-0 -translate-x-s3 opacity-0',
          )}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className="size-icon-sm shrink-0"
          >
            <path d="M4.5 10.5l3.5 3.5 7.5-8" />
          </svg>
        </span>
        {children}
      </button>
    );
  },
);
