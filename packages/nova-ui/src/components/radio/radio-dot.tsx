import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';

export interface RadioDotProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  // Classes for the span that holds the input and its drawn dot.
  boxClassName?: string;
}

// The drawn circle of a radio, shared by Radio and ChoiceCard: a real <input type="radio"> with the
// dot drawn on top as a shape, so "selected" never depends on colour alone. The dot grows in from half
// size (transform and opacity only) and the circle presses in; both motion-safe, so under reduced
// motion the change is instant.
export const RadioDot = forwardRef<HTMLInputElement, RadioDotProps>(
  function RadioDot({ boxClassName, className, ...rest }, ref) {
    return (
      <span className={cx('relative flex size-check shrink-0', boxClassName)}>
        <input
          {...rest}
          ref={ref}
          type="radio"
          // nova-field draws the 3:1 edge and turns it primary when checked; checked fills too.
          className={cx(
            'nova-field peer size-check appearance-none rounded-full',
            'checked:bg-primary',
            'motion-safe:transition-[background-color,border-color,transform] motion-safe:duration-fast motion-safe:ease-standard motion-safe:active:scale-90',
            focusRing,
            'disabled:cursor-not-allowed',
            className,
          )}
        />
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute inset-0 m-auto size-s3 scale-50 text-on-primary opacity-0 peer-checked:scale-100 peer-checked:opacity-100 motion-safe:transition-[transform,opacity] motion-safe:duration-base motion-safe:ease-standard"
        >
          <circle cx="10" cy="10" r="10" />
        </svg>
      </span>
    );
  },
);
