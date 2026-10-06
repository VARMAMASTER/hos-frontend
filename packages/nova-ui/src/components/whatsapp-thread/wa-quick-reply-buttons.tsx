import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { useControllableState } from '../../primitives/use-controllable-state';

export interface WaQuickReplyOption {
  value: string;
  label: ReactNode;
}

export interface WaQuickReplyButtonsProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  options: readonly WaQuickReplyOption[];
  // The reply picked. null (or nothing) until one is; once it is, the buttons lock.
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  // The group's name for a screen reader ("Pick a slot").
  label?: string;
}

// WhatsApp's interactive reply buttons (hos.css .wa-btns, .wa-btn): a column of 12px semibold replies
// in WhatsApp's accent. Like WhatsApp's own, they lock once one is picked: every button becomes
// aria-disabled (still focusable and read), the chosen one stays aria-pressed with a tick, so the
// conversation shows what was answered. Picking only calls onValueChange; nothing is sent.
export function WaQuickReplyButtons({
  options,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  label = 'Quick replies',
  className,
  ...rest
}: WaQuickReplyButtonsProps) {
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onChange: (next) => {
      if (next !== null) onValueChange?.(next);
    },
  });
  const locked = value !== null;

  return (
    <div
      role="group"
      aria-label={label}
      data-locked={locked ? 'true' : undefined}
      // .wa-btns: 4px apart, 6px under the message.
      className={cx('mt-1.5 flex flex-col gap-1', className)}
      {...rest}
    >
      {options.map((option) => {
        const chosen = locked && option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={locked ? chosen : undefined}
            aria-disabled={locked || undefined}
            data-chosen={chosen ? 'true' : undefined}
            onClick={() => {
              if (!locked) setValue(option.value);
            }}
            className={cx(
              // .wa-btn: 12px semibold, 6px of padding, a 7px radius (sm), centred.
              'flex w-full items-center justify-center gap-1 rounded-sm bg-wa-in p-1.5 text-center text-[12px] font-semibold',
              'motion-safe:transition-colors motion-safe:duration-fast motion-safe:ease-standard',
              focusRing,
              !locked && 'cursor-pointer text-wa-accent hover:bg-wa-hover',
              chosen && 'cursor-default text-wa-accent',
              locked && !chosen && 'cursor-not-allowed text-wa-ink-2',
            )}
          >
            {chosen ? <span aria-hidden="true">✓</span> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
