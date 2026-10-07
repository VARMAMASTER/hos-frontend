import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { disabledField } from '../../primitives/states';
import { FieldShell } from '../text-field/field-shell';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// A native <select>: keyboard handling, typeahead and screen-reader behaviour come from the
// platform. `multiple` and `size` are left out because the styling is for a single choice.
export interface SelectProps
  extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    'children' | 'multiple' | 'size'
  > {
  label: ReactNode;
  hint?: ReactNode;
  // Setting it marks the field invalid and announces the message; clear it to clear the state.
  error?: ReactNode;
  options: readonly SelectOption[];
  // Shown until a choice is made. On a required field it cannot be chosen; on an optional one it can,
  // which is how a choice is cleared.
  placeholder?: string;
}

const base = cx(
  // The prototype's select.f-input: 13.5px, the field inset, room on the right for the chevron, at
  // h-control-md like TextField and Button.
  'nova-field peer block h-control-md w-full appearance-none rounded-control pl-field pr-field-icon text-input text-ink transition-colors',
  focusRing,
  disabledField,
);

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      id,
      label,
      hint,
      error,
      options,
      placeholder,
      required,
      className,
      value,
      defaultValue,
      'aria-describedby': describedBy,
      ...rest
    },
    ref,
  ) {
    // Without a selected option the browser picks the first enabled one, which would hide a
    // placeholder, so an uncontrolled select starts on the empty value when it has one.
    const selection =
      value !== undefined
        ? { value }
        : { defaultValue: defaultValue ?? (placeholder ? '' : undefined) };

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
            <select
              ref={ref}
              required={required}
              data-invalid={field['aria-invalid'] ? 'true' : undefined}
              className={base}
              {...selection}
              {...rest}
              {...field}
            >
              {placeholder ? (
                <option value="" disabled={required}>
                  {placeholder}
                </option>
              ) : null}
              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
              className="pointer-events-none absolute right-field size-icon-md text-ink-3 peer-disabled:opacity-50"
            >
              <path d="M5 8l5 5 5-5" />
            </svg>
          </div>
        )}
      </FieldShell>
    );
  },
);
