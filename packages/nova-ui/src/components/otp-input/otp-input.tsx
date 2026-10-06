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
import { playMotion } from '../../primitives/motion';

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
      {/* label.f-label: 12px, weight 600, ink-2. */}
      <label htmlFor={inputId} className="text-[12px] font-semibold text-ink-2">
        {label}
      </label>
      <div ref={boxesRef} className="relative w-full">
        <div aria-hidden="true" className="flex w-full gap-2">
          {Array.from({ length }, (_, index) => {
            const active = focused && !disabled && index === activeIndex;
            const filled = index < code.length;
            return (
              <div
                key={index}
                data-otp-box=""
                data-active={active ? 'true' : undefined}
                className={cx(
                  // 01-login.html .otp-box: 44 x 50, a 1.5px edge, IBM Plex Mono 600 (20px: the nearest
                  // hos.css size to the page's 19px), the row gap is --space-3. The boxes share the row and
                  // shrink to fit it (min-w-0), capped at the prototype's 44px; the radius is --r-sm for
                  // the prototype's 10px. The empty edge is the control edge (3:1), not --line-strong.
                  'flex h-[50px] max-w-11 min-w-0 flex-1 basis-0 items-center justify-center rounded-sm border-[1.5px] font-mono text-[20px] font-semibold',
                  error
                    ? 'border-crit'
                    : active || filled
                      ? 'border-primary'
                      : 'border-border-control',
                  // .otp-box.filled: the brand edge, a brand tint and brand text.
                  filled && !error
                    ? 'bg-primary-soft text-primary-strong'
                    : 'bg-surface text-ink',
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
        <p id={hintId} className="text-[12px] text-ink-2">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-[12px] text-crit-deep">
          {error}
        </p>
      ) : null}
    </div>
  );
}
