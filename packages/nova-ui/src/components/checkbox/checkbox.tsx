import {
  forwardRef,
  useId,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { useControllableState } from '../../primitives/use-controllable-state';
import { CheckboxBox } from '../../primitives/checkbox-box';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  label: ReactNode;
  // The mixed state, for a parent box over a partly chosen list (some wards of all). It is the
  // input's own property, so assistive technology reads it as mixed; a click still clears it
  // natively, and the parent decides whether it comes back.
  indeterminate?: boolean;
}

// A real <input type="checkbox">, so Space, form submission and `required` come from the platform;
// the box, the tick (drawn in) and the mixed dash are drawn on top. Its checked state goes through
// useControllableState like every other Nova control. `className` styles the wrapper.
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      id: idProp,
      label,
      className,
      disabled,
      checked,
      defaultChecked = false,
      indeterminate,
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
          'inline-flex min-h-touch items-start gap-s5',
          disabled && 'opacity-50',
          className,
        )}
      >
        <CheckboxBox
          ref={ref}
          id={id}
          // The 44px row centres the 20px box: 12px down.
          boxClassName="mt-s5"
          indeterminate={indeterminate}
          disabled={disabled}
          checked={isChecked}
          onChange={handleChange}
          {...rest}
        />
        <label
          htmlFor={id}
          className={cx(
            'flex min-h-touch items-center py-s3 text-input text-ink',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          {label}
        </label>
      </div>
    );
  },
);
