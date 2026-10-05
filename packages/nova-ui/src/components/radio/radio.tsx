import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export interface RadioProps extends Omit<
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
      className={[
        'inline-flex items-start gap-3',
        disabled ? 'opacity-50' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="relative flex h-5 w-5 shrink-0">
        <input
          ref={ref}
          type="radio"
          id={id}
          disabled={disabled}
          // Browsers never report a change on a disabled control; this keeps that true for
          // synthetic events as well.
          onChange={disabled ? undefined : onChange}
          // ink-3 edge for 3:1 against the surface (WCAG 1.4.11); checked fills with primary.
          className={
            'nova-field peer h-5 w-5 appearance-none rounded-full border border-ink-3 ' +
            'checked:border-primary checked:bg-primary ' +
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
            'disabled:cursor-not-allowed'
          }
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
        className={[
          'text-sm text-ink',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        {label}
      </label>
    </div>
  );
});
