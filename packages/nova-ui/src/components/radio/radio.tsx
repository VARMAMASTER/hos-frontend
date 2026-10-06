import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';

export interface RadioProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'children' | 'name'
  > {
  label: ReactNode;
  // Radios with the same name form one group: one choice, arrow keys move within it.
  name: string;
}

// A real <input type="radio">; the group behaviour, arrow-key movement and form value come from
// the platform. Wrap a group in a <fieldset> with a <legend> so it has a name of its own.
// `className` styles the wrapper.
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { id: idProp, label, className, disabled, onChange, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <div
      className={cx(
        'inline-flex min-h-11 items-start gap-3',
        disabled && 'opacity-50',
        className,
      )}
    >
      <span className="relative mt-3 flex h-5 w-5 shrink-0">
        <input
          ref={ref}
          type="radio"
          id={id}
          disabled={disabled}
          // Browsers never report a change on a disabled control; this keeps that true for
          // synthetic events as well.
          onChange={disabled ? undefined : onChange}
          // nova-field draws the 3:1 edge and turns it primary when checked; checked fills too.
          className={cx(
            'nova-field peer h-5 w-5 appearance-none rounded-full',
            'checked:bg-primary',
            focusRing,
            'disabled:cursor-not-allowed',
          )}
          {...rest}
        />
        {/* The dot is a shape, so "selected" never depends on colour alone. */}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute inset-0 m-auto h-2 w-2 text-on-primary opacity-0 peer-checked:opacity-100"
        >
          <circle cx="10" cy="10" r="10" />
        </svg>
      </span>
      <label
        htmlFor={id}
        className={cx(
          'flex min-h-11 items-center py-2 text-[13.5px] text-ink',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        {label}
      </label>
    </div>
  );
});
