import {
  forwardRef,
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type Ref,
} from 'react';
import { cx } from './cx';
import { focusRing } from './focus-ring';

export interface CheckboxBoxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  // The mixed state, as a property of the input itself: assistive technology reads it as mixed.
  indeterminate?: boolean;
  // Classes for the span that holds the input and its drawn marks.
  boxClassName?: string;
}

function assign<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) ref.current = node;
}

// The drawn box of a checkbox, shared by Checkbox and ChoiceCard: a real <input type="checkbox"> with
// the tick and the mixed dash drawn on top as shapes, so a state never rests on colour alone. The tick
// is a path drawn in with its stroke-dashoffset (pathLength 1: 1 is hidden, 0 is whole), the dash
// fades in, and the box presses in; all of it motion-safe, so reduced motion changes state instantly.
export const CheckboxBox = forwardRef<HTMLInputElement, CheckboxBoxProps>(
  function CheckboxBox(
    { indeterminate = false, boxClassName, className, ...rest },
    ref,
  ) {
    const input = useRef<HTMLInputElement | null>(null);
    // `indeterminate` is a property, not an attribute, and a click clears it natively; setting it on
    // every render keeps a parent that still wants "mixed" in charge.
    useEffect(() => {
      if (input.current) input.current.indeterminate = indeterminate;
    });
    return (
      <span className={cx('relative flex size-check shrink-0', boxClassName)}>
        <input
          {...rest}
          ref={(node) => {
            input.current = node;
            assign(ref, node);
          }}
          type="checkbox"
          // nova-field draws the 3:1 edge and turns it primary when checked or mixed; both fill too.
          className={cx(
            'nova-field peer size-check appearance-none rounded-control',
            'checked:bg-primary indeterminate:bg-primary indeterminate:[--nova-field-edge:var(--nova-color-primary)]',
            'motion-safe:transition-[background-color,border-color,transform] motion-safe:duration-fast motion-safe:ease-standard motion-safe:active:scale-90',
            focusRing,
            'disabled:cursor-not-allowed',
            className,
          )}
        />
        <svg
          data-mark="check"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
          className={cx(
            'pointer-events-none absolute inset-0 m-auto size-icon-sm text-on-primary opacity-0',
            '[stroke-dasharray:1] [stroke-dashoffset:1]',
            'peer-[:checked:not(:indeterminate)]:opacity-100 peer-[:checked:not(:indeterminate)]:[stroke-dashoffset:0]',
            'motion-safe:transition-[stroke-dashoffset,opacity] motion-safe:duration-base motion-safe:ease-standard',
          )}
        >
          <path d="M4.5 10.5l3.5 3.5 7.5-8" pathLength="1" />
        </svg>
        <svg
          data-mark="mixed"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute inset-0 m-auto size-icon-sm text-on-primary opacity-0 peer-indeterminate:opacity-100 motion-safe:transition-opacity motion-safe:duration-fast motion-safe:ease-standard"
        >
          <path d="M5 10h10" />
        </svg>
      </span>
    );
  },
);
