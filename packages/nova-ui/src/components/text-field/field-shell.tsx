import { useId, type ReactNode } from 'react';

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
  const describedby =
    [describedBy, hasHint ? hintId : undefined, hasError ? errorId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={['flex flex-col', className].filter(Boolean).join(' ')}>
      {/* The asterisk sits beside the <label>, not inside it, so the accessible name stays the
          label text; the control's own `required` attribute is what assistive tech announces. */}
      <div className="flex items-baseline gap-1">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {required ? (
          <span
            aria-hidden="true"
            className="text-sm font-medium text-crit-deep"
          >
            *
          </span>
        ) : null}
      </div>
      <div className="mt-1.5">
        {children({
          id,
          'aria-invalid': hasError ? true : undefined,
          'aria-describedby': describedby,
        })}
      </div>
      {hasHint ? (
        <p id={hintId} className="mt-1.5 text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
      {/* The live region is always mounted so an error that appears later is announced; one
          inserted together with its own live region is often missed. */}
      <div aria-live="polite">
        {hasError ? (
          <p
            id={errorId}
            className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-crit-deep"
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
      className="mt-px h-4 w-4 shrink-0"
    >
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6v4.5M10 13.5h.01" />
    </svg>
  );
}
