import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { FieldShell } from './field-shell';

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: ReactNode;
  hint?: ReactNode;
  // Setting it marks the field invalid and announces the message; clear it to clear the state.
  error?: ReactNode;
  // Decorative only (they are aria-hidden and ignore the pointer); an icon that does something
  // belongs in its own button next to the field.
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const base = cx(
  'nova-field peer block h-10 w-full rounded-md text-sm text-ink placeholder:text-ink-3 transition-colors',
  focusRing,
  'disabled:cursor-not-allowed disabled:opacity-50',
);

// The edge (3:1 at rest, ink-2 on hover, crit when aria-invalid) is nova-field's own: see theme.css.

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
              className={cx(
                base,
                leadingIcon ? 'pl-10' : 'pl-3',
                trailingIcon ? 'pr-10' : 'pr-3',
              )}
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
