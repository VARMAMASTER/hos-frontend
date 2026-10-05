import {
  forwardRef,
  useId,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { useControllableState } from '../../primitives/use-controllable-state';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  label: ReactNode;
}

// A real <input type="checkbox">, so Space, form submission and `required` come from the platform;
// the box and tick are drawn on top. Its checked state goes through useControllableState like every
// other Nova control. `className` styles the wrapper.
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      id: idProp,
      label,
      className,
      disabled,
      checked,
      defaultChecked = false,
      onChange,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const [isChecked, setChecked] = useControllableState({
      value: checked,
      defaultValue: defaultChecked,
    });

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      // Browsers never report a change on a disabled control; this keeps that true for synthetic
      // events as well.
      if (disabled) return;
      setChecked(event.target.checked);
      onChange?.(event);
    }

    return (
      <div
        className={cx(
          'inline-flex items-start gap-3',
          disabled && 'opacity-50',
          className,
        )}
      >
        <span className="relative flex h-5 w-5 shrink-0">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            disabled={disabled}
            checked={isChecked}
            onChange={handleChange}
            // nova-field draws the 3:1 edge and turns it primary when checked; checked fills too.
            className={cx(
              'nova-field peer h-5 w-5 appearance-none rounded-sm',
              'checked:bg-primary',
              focusRing,
              'disabled:cursor-not-allowed',
            )}
            {...rest}
          />
          {/* The tick is a shape, so "checked" never depends on colour alone. */}
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className="pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 text-on-primary opacity-0 peer-checked:opacity-100"
          >
            <path d="M4.5 10.5l3.5 3.5 7.5-8" />
          </svg>
        </span>
        <label
          htmlFor={id}
          className={cx(
            'text-sm text-ink',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          {label}
        </label>
      </div>
    );
  },
);
