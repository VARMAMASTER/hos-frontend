import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { useControllableState } from '../../primitives/use-controllable-state';
import { playMotion } from '../toast/motion';

export interface OtpInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'type'
    | 'inputMode'
    | 'autoComplete'
    | 'maxLength'
    | 'pattern'
    | 'className'
    | 'children'
  > {
  // How many digits the code has.
  length?: number;
  // Controlled when given: the field reports changes through onChange and the parent decides.
  value?: string;
  defaultValue?: string;
  // Called with the digits so far, on every accepted change.
  onChange?: (value: string) => void;
  // Called once with the code when its last digit arrives (typed, pasted or autofilled). It fires
  // again only after the code has changed to a different complete one.
  onComplete?: (code: string) => void;
  // The visible label, which is also the input's accessible name.
  label?: ReactNode;
  // Supporting text under the boxes, wired to the input as its description.
  hint?: ReactNode;
  // The error line. It is announced when it appears, shown in crit text beside crit box edges, and
  // the boxes shake once (not under prefers-reduced-motion). Clear it when the code is edited, so a
  // second failure shakes again.
  error?: string;
  // Styles the root, not the input.
  className?: string;
}

// The digits in `raw`, or null when it holds anything else. Spaces and hyphens are the separators a
// code is often written with ("482 913"), so they are dropped; a letter rejects the whole thing,
// because half a pasted code is worse than none.
function parseDigits(raw: string, length: number): string | null {
  const compact = raw.replace(/[\s-]/g, '');
  return /^\d*$/.test(compact) ? compact.slice(0, length) : null;
}

const SHAKE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-6px)' },
  { transform: 'translateX(6px)' },
  { transform: 'translateX(-4px)' },
  { transform: 'translateX(4px)' },
  { transform: 'translateX(0)' },
];

// A one-time-code field: six square boxes drawn over ONE real input. The input is what the keyboard,
// the password manager, the SMS autofill and the screen reader talk to (numeric keypad,
// autocomplete="one-time-code", a label); the boxes are only its picture, so they are hidden from
// assistive technology. It serves sign-in by mobile OTP.
export function OtpInput({
  length = 6,
  value,
  defaultValue = '',
  onChange,
  onComplete,
  label = 'One-time code',
  hint,
  error,
  className,
  id,
  disabled,
  onFocus,
  onBlur,
  'aria-describedby': describedBy,
  ...rest
}: OtpInputProps) {
  const generated = useId();
  const inputId = id ?? `${generated}-input`;
  const hintId = `${generated}-hint`;
  const errorId = `${generated}-error`;
  const [code, setCode] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const [focused, setFocused] = useState(false);
  const boxesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) playMotion(boxesRef.current, SHAKE, { duration: 240 });
  }, [error]);

  const commit = (raw: string) => {
    const digits = parseDigits(raw, length);
    if (digits === null || digits === code) return;
    setCode(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  const activeIndex = Math.min(code.length, length - 1);
  const describedIds =
    cx(describedBy, hint ? hintId : null, error ? errorId : null) || undefined;

  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <label htmlFor={inputId} className="text-callout font-semibold text-ink">
        {label}
      </label>
      <div ref={boxesRef} className="relative w-full">
        <div aria-hidden="true" className="flex w-full gap-2">
          {Array.from({ length }, (_, index) => {
            const active = focused && !disabled && index === activeIndex;
            return (
              <div
                key={index}
                data-otp-box=""
                data-active={active ? 'true' : undefined}
                className={cx(
                  // Fluid: the boxes share the row and shrink to fit it (min-w-0), staying square and capped at 56px.
                  'flex aspect-square max-w-14 min-w-0 flex-1 basis-0 items-center justify-center rounded-md border bg-surface text-title3 font-semibold text-ink',
                  error
                    ? 'border-crit'
                    : active
                      ? 'border-primary'
                      : 'border-border-control',
                  active &&
                    (error ? 'ring-2 ring-crit' : 'ring-2 ring-primary'),
                  disabled && 'opacity-50',
                )}
              >
                {code[index] ?? ''}
              </div>
            );
          })}
        </div>
        <input
          {...rest}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={length}
          value={code}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedIds}
          onChange={(event) => commit(event.target.value)}
          onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
            event.preventDefault();
            const text = event.clipboardData.getData('text');
            if (text) commit(text);
          }}
          onFocus={(event: FocusEvent<HTMLInputElement>) => {
            setFocused(true);
            // The boxes only ever grow from the end, so the caret belongs there.
            const end = event.target.value.length;
            event.target.setSelectionRange(end, end);
            onFocus?.(event);
          }}
          onBlur={(event: FocusEvent<HTMLInputElement>) => {
            setFocused(false);
            onBlur?.(event);
          }}
          className="absolute inset-0 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
        />
      </div>
      {hint ? (
        <p id={hintId} className="text-caption text-ink-2">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-caption text-crit-deep">
          {error}
        </p>
      ) : null}
    </div>
  );
}
