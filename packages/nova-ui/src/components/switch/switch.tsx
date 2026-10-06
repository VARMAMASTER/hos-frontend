import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { useControllableState } from '../../primitives/use-controllable-state';

export interface SwitchProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'type' | 'role' | 'children' | 'onChange' | 'defaultChecked'
  > {
  label: ReactNode;
  // Controlled when given; the switch then only asks, and the parent decides.
  checked?: boolean;
  defaultChecked?: boolean;
  // A <button> raises no change event, so this reports the new state directly.
  onCheckedChange?: (checked: boolean) => void;
}

// A <button role="switch">. As a native button it is focusable and activates on Space and on Enter
// with no key handling here; adding some would risk toggling twice. `className` styles the wrapper.
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
    {
      id: idProp,
      label,
      className,
      checked,
      defaultChecked = false,
      disabled,
      onClick,
      onCheckedChange,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const [isOn, setOn] = useControllableState({
      value: checked,
      defaultValue: defaultChecked,
      onChange: onCheckedChange,
    });

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      // A disabled <button> never reaches here: React drops its clicks.
      if (event.defaultPrevented) return;
      setOn(!isOn);
    }

    return (
      <div
        className={cx(
          'inline-flex min-h-11 items-center gap-3',
          disabled && 'opacity-50',
          className,
        )}
      >
        <button
          ref={ref}
          type="button"
          role="switch"
          id={id}
          aria-checked={isOn}
          disabled={disabled}
          // The iOS track. Off, it is filled with the control ink (border-control, 3:1 against its
          // backdrop, material.spec.ts), so the track is its own boundary and the white thumb reads
          // on it at 4.8:1. On, it fills with the primary, which nova-field also edges.
          className={cx(
            'nova-field group relative inline-flex h-7 w-12 shrink-0 items-center rounded-full',
            '[--nova-field-fill:var(--nova-color-border-control)] hover:[--nova-field-fill:var(--nova-color-ink-2)]',
            'transition-colors duration-200 ease-out motion-reduce:transition-none aria-checked:bg-primary',
            focusRing,
            'disabled:cursor-not-allowed',
          )}
          {...rest}
          onClick={handleClick}
        >
          {/* The thumb's position is the non-colour signal for on and off. */}
          <span
            aria-hidden="true"
            className={
              'pointer-events-none block size-6 translate-x-px rounded-full bg-on-primary ' +
              'transition-transform duration-200 ease-out motion-reduce:transition-none ' +
              'group-aria-checked:translate-x-5.25'
            }
          />
        </button>
        <label
          htmlFor={id}
          className={cx(
            'text-[13.5px] text-ink',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          {label}
        </label>
      </div>
    );
  },
);
