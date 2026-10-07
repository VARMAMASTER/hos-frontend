import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { RadioDot } from '../../primitives/radio-dot';

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
// the platform, and the dot grows in with a transform. Wrap a group in a <fieldset> with a <legend>
// so it has a name of its own. `className` styles the wrapper.
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { id: idProp, label, className, disabled, onChange, ...rest },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <div
      className={cx(
        'inline-flex min-h-touch items-start gap-s5',
        disabled && 'opacity-50',
        className,
      )}
    >
      <RadioDot
        ref={ref}
        id={id}
        // The 44px row centres the 20px circle: 12px down.
        boxClassName="mt-s5"
        disabled={disabled}
        // Browsers never report a change on a disabled control; this keeps that true for
        // synthetic events as well.
        onChange={disabled ? undefined : onChange}
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
});
