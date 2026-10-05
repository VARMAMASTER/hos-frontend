import {
  forwardRef,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';

export interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'role' | 'children' | 'onChange' | 'defaultChecked'
> {
  label: ReactNode;
  // Controlled when given; the switch then only asks, and the parent decides.
  checked?: boolean;
  defaultChecked?: boolean;
  // A <button> raises no change event, so this reports the new state directly.
  onCheckedChange?: (checked: boolean) => void;
}

// A <button role="switch">. As a native button it is focusable and activates on Space and on Enter
// with no key handling here; adding some would risk toggling twice. `className` styles the wrapper.
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
    {
      id: idProp,
      label,
      className,
      checked,
      defaultChecked = false,
      disabled,
      onClick,
      onCheckedChange,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const [uncontrolled, setUncontrolled] = useState(defaultChecked);
    const isControlled = checked !== undefined;
    const isOn = isControlled ? checked : uncontrolled;

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      // A disabled <button> never reaches here: React drops its clicks.
      if (event.defaultPrevented) return;
      const next = !isOn;
      if (!isControlled) setUncontrolled(next);
      onCheckedChange?.(next);
    }

    return (
      <div
        className={[
          'inline-flex items-center gap-3',
          disabled ? 'opacity-50' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <button
          ref={ref}
          type="button"
          role="switch"
          id={id}
          aria-checked={isOn}
          disabled={disabled}
          // ink-3 edge for 3:1 against the surface (WCAG 1.4.11); on fills with primary.
          className={
            'nova-field group relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-ink-3 ' +
            'transition-colors motion-reduce:transition-none aria-checked:border-primary aria-checked:bg-primary ' +
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
            'disabled:cursor-not-allowed'
          }
          {...rest}
          onClick={handleClick}
        >
          {/* The thumb's position is the non-colour signal for on and off. */}
          <span
            aria-hidden="true"
            className={
              'pointer-events-none block h-4 w-4 translate-x-0.75 rounded-full bg-ink-3 ' +
              'transition-transform motion-reduce:transition-none ' +
              'group-aria-checked:translate-x-5.75 group-aria-checked:bg-on-primary'
            }
          />
        </button>
        <label
          htmlFor={id}
          className={[
            'text-sm text-ink',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
        >
          {label}
        </label>
      </div>
    );
  },
);
