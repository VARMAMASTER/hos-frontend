import { useId, type ReactNode } from 'react';
import { cx } from '../../primitives/cx';

// The label / hint / error markup that TextField, Textarea and Select share. Internal: it is not
// exported from the package barrel. Each control keeps its own element and its own classes; the
// shell only owns what must stay identical across them, which is how the field is named and
// described to assistive technology.

// What a control takes from its field: the resolved id (a caller-supplied one wins) and the two
// attributes that make the hint and the error part of its accessible description.
export interface FieldControlProps {
  id: string;
  'aria-invalid': true | undefined;
  'aria-describedby': string | undefined;
}

export interface FieldShellProps {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  // The caller's own aria-describedby; it stays ahead of the hint and error ids.
  describedBy?: string;
  // Styles the wrapper (width, margins), never the control.
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

function isPresent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

export function FieldShell({
  id: idProp,
  label,
  hint,
  error,
  required,
  describedBy,
  className,
  children,
}: FieldShellProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const hasHint = isPresent(hint);
  const hasError = isPresent(error);
  // Space-separated ids, the caller's own first; cx drops the parts that are not there.
  const describedby =
    cx(describedBy, hasHint && hintId, hasError && errorId) || undefined;

  return (
    <div className={cx('flex flex-col', className)}>
      {/* The asterisk sits beside the <label>, not inside it, so the accessible name stays the
          label text; the control's own `required` attribute is what assistive tech announces. */}
      <div className="flex items-baseline gap-1">
        <label htmlFor={id} className="text-callout font-semibold text-ink">
          {label}
        </label>
        {required ? (
          <span
            aria-hidden="true"
            className="text-callout font-semibold text-crit-deep"
          >
            *
          </span>
        ) : null}
      </div>
      <div className="mt-1">
        {children({
          id,
          'aria-invalid': hasError ? true : undefined,
          'aria-describedby': describedby,
        })}
      </div>
      {hasHint ? (
        <p id={hintId} className="mt-1 text-caption text-ink-3">
          {hint}
        </p>
      ) : null}
      {/* The live region is always mounted so an error that appears later is announced; one
          inserted together with its own live region is often missed. */}
      <div aria-live="polite">
        {hasError ? (
          <p
            id={errorId}
            className="mt-1 flex items-start gap-1.5 text-caption font-semibold text-crit-deep"
          >
            <ErrorIcon />
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// Colour is never the only signal: the message is text and carries a shape as well.
function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="mt-px size-4 shrink-0"
    >
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6v4.5M10 13.5h.01" />
    </svg>
  );
}
