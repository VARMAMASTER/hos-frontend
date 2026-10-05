import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { FieldShell } from '../text-field/field-shell';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> {
  label: ReactNode;
  hint?: ReactNode;
  // Setting it marks the field invalid and announces the message; clear it to clear the state.
  error?: ReactNode;
  // Visible lines before it scrolls; the user can still drag it taller. Defaults to 3.
  rows?: number;
}

// Same contract and the same label / hint / error markup as TextField (through FieldShell); only
// the element and its sizing differ.
const base = cx(
  'nova-field block min-h-20 w-full resize-y rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-3 transition-colors',
  focusRing,
  'disabled:cursor-not-allowed disabled:opacity-50',
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      id,
      label,
      hint,
      error,
      required,
      className,
      rows = 3,
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
          <textarea
            ref={ref}
            rows={rows}
            required={required}
            data-invalid={field['aria-invalid'] ? 'true' : undefined}
            className={base}
            {...rest}
            {...field}
          />
        )}
      </FieldShell>
    );
  },
);
