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
import { MOTION_DURATIONS_MS } from '../../tokens/scale';

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

// The error shake: the boxes swing s2 (6px) to each side, then s1 (4px), and settle. The offsets are
// the spacing tokens, so the swing follows the scale.
const SHAKE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(calc(var(--nova-space-2) * -1))' },
  { transform: 'translateX(var(--nova-space-2))' },
  { transform: 'translateX(calc(var(--nova-space-1) * -1))' },
  { transform: 'translateX(var(--nova-space-1))' },
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
    if (error)
      playMotion(boxesRef.current, SHAKE, {
        duration: MOTION_DURATIONS_MS.slow,
      });
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
    <div className={cx('flex flex-col gap-s1', className)}>
      {/* label.f-label: the label role (12px), weight 600, ink-2. */}
      <label htmlFor={inputId} className="text-label font-semibold text-ink-2">
        {label}
      </label>
      <div ref={boxesRef} className="relative w-full">
        <div aria-hidden="true" className="flex w-full gap-s3">
          {Array.from({ length }, (_, index) => {
            const active = focused && !disabled && index === activeIndex;
            const filled = index < code.length;
            return (
              <div
                key={index}
                data-otp-box=""
                data-active={active ? 'true' : undefined}
                className={cx(
                  // 01-login.html .otp-box: 44 x 50 (max-w-otp-box, h-otp-box), a 1.5px edge
                  // (border-otp-box), IBM Plex Mono 600 (the headline role, 20px: the nearest hos.css size
                  // to the page's 19px), the row gap is --space-3. The boxes share the row and shrink to
                  // fit it (min-w-0), capped at the box width; the radius is the control corner for the
                  // prototype's 10px. The empty edge is the control edge (3:1), not --line-strong.
                  'flex h-otp-box max-w-otp-box min-w-0 flex-1 basis-0 items-center justify-center rounded-control border-otp-box font-mono text-headline font-semibold',
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
                    (error
                      ? 'ring-emphasis ring-crit'
                      : 'ring-emphasis ring-primary'),
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
        <p id={hintId} className="text-label text-ink-2">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-label text-crit-deep">
          {error}
        </p>
      ) : null}
    </div>
  );
}
