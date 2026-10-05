import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { FieldShell } from './field-shell';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'children'
> {
  label: ReactNode;
  hint?: ReactNode;
  // Setting it marks the field invalid and announces the message; clear it to clear the state.
  error?: ReactNode;
  // Decorative only (they are aria-hidden and ignore the pointer); an icon that does something
  // belongs in its own button next to the field.
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const base =
  'nova-field peer block h-10 w-full rounded-md border text-sm text-ink placeholder:text-ink-3 ' +
  'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

// The border is ink-3, not border-strong: a field's edge is the only thing that says "type here",
// so it needs 3:1 against its surroundings (WCAG 1.4.11) and border-strong is only about 1.6:1.
const valid = 'border-ink-3 hover:border-ink-2 focus-visible:outline-primary';
const invalid = 'border-crit focus-visible:outline-crit';

const iconSlot =
  'pointer-events-none absolute flex text-ink-3 peer-disabled:opacity-50';

// `className` styles the wrapper (the field as a block in a layout); everything else goes to the <input>.
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      id,
      label,
      hint,
      error,
      leadingIcon,
      trailingIcon,
      required,
      className,
      type = 'text',
      'aria-describedby': describedBy,
      ...rest
    },
    ref,
  ) {
    return (
      <FieldShell
        id={id}
        label={label}
        hint={hint}
        error={error}
        required={required}
        describedBy={describedBy}
        className={className}
      >
        {(field) => (
          <div className="relative flex items-center">
            <input
              ref={ref}
              type={type}
              required={required}
              data-invalid={field['aria-invalid'] ? 'true' : undefined}
              className={[
                base,
                field['aria-invalid'] ? invalid : valid,
                leadingIcon ? 'pl-10' : 'pl-3',
                trailingIcon ? 'pr-10' : 'pr-3',
              ].join(' ')}
              {...rest}
              {...field}
            />
            {leadingIcon ? (
              <span aria-hidden="true" className={`${iconSlot} left-3`}>
                {leadingIcon}
              </span>
            ) : null}
            {trailingIcon ? (
              <span aria-hidden="true" className={`${iconSlot} right-3`}>
                {trailingIcon}
              </span>
            ) : null}
          </div>
        )}
      </FieldShell>
    );
  },
);
