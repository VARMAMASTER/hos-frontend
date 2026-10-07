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
          'inline-flex min-h-touch items-center gap-s5',
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
            'nova-field group relative inline-flex h-switch w-switch shrink-0 items-center rounded-full',
            '[--nova-field-fill:var(--nova-color-border-control)] hover:[--nova-field-fill:var(--nova-color-ink-2)]',
            'motion-safe:transition-colors motion-safe:duration-base motion-safe:ease-standard aria-checked:bg-primary',
            focusRing,
            'disabled:cursor-not-allowed',
          )}
          {...rest}
          onClick={handleClick}
        >
          {/* The thumb's position is the non-colour signal for on and off, and the check in it says
              "on" in a shape too. Pressed, it stretches from the edge it sits on (a transform only);
              all of it is motion-safe, so under reduced motion it moves instantly. */}
          <span
            aria-hidden="true"
            className={
              'pointer-events-none grid size-switch-thumb translate-x-px origin-left place-items-center rounded-full bg-on-primary ' +
              'motion-safe:transition-transform motion-safe:duration-base motion-safe:ease-standard ' +
              'group-aria-checked:origin-right group-aria-checked:translate-x-switch-travel group-active:scale-x-125'
            }
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
              className="size-icon-sm text-primary opacity-0 group-aria-checked:opacity-100 motion-safe:transition-opacity motion-safe:duration-base motion-safe:ease-standard"
            >
              <path d="M4.5 10.5l3.5 3.5 7.5-8" />
            </svg>
          </span>
        </button>
        <label
          htmlFor={id}
          className={cx(
            'text-input text-ink',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          {label}
        </label>
      </div>
    );
  },
);
