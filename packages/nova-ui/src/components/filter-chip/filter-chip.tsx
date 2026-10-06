import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
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

// A filter toggle, the prototype's .fchip (02-reception.html): a 12px / 600 pill with a line-strong
// edge on the panel when off, and the brand fill when on. A <button aria-pressed>, so Space and Enter
// toggle it with no key handling here. On also shows a tick: the state never rests on colour alone.
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
          // .fchip: 1px edge, 12px / 600, padding 6px 10px (--space-2 --space-4), a full radius; the
          // tick takes a 6px gap (--space-2).
          'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] font-semibold',
          'transition-[color,background-color,border-color] duration-150 ease-out motion-reduce:transition-none',
          isOn
            ? 'border-primary bg-primary text-on-primary'
            : 'border-border-strong bg-surface text-ink-2 hover:border-primary hover:text-primary-strong',
          focusRing,
          'disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
        {...rest}
        onClick={handleClick}
      >
        {isOn ? (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className="-ml-0.5 size-3.5 shrink-0"
          >
            <path d="M4.5 10.5l3.5 3.5 7.5-8" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  },
);
