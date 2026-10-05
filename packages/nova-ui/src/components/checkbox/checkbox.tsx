import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'children'
> {
  label: ReactNode;
}

// A real <input type="checkbox">, so toggling, Space, form submission and `required` all come from
// the platform; the box and tick are drawn on top. `className` styles the wrapper.
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
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
            type="checkbox"
            id={id}
            disabled={disabled}
            // Browsers never report a change on a disabled control; this keeps that true for
            // synthetic events as well.
            onChange={disabled ? undefined : onChange}
            // ink-3 edge for 3:1 against the surface (WCAG 1.4.11); checked fills with primary.
            className={
              'nova-field peer h-5 w-5 appearance-none rounded-sm border border-ink-3 ' +
              'checked:border-primary checked:bg-primary ' +
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
              'disabled:cursor-not-allowed'
            }
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
          className={[
            'text-sm text-ink',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
        >
          {label}
        </label>
      </div>
    );
  },
);
