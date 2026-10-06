import {
  forwardRef,
  useId,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { VisuallyHidden } from '../../primitives/visually-hidden';

export interface SearchFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  // The accessible name. Rendered as visually hidden <label> text; a placeholder is not a name.
  label: string;
  icon?: ReactNode;
  shortcutHint?: ReactNode;
  onValueChange?: (value: string) => void;
}

// The field sits on the dark chrome, so it is a translucent white fill with a white rim rather than
// nova-field (the light-canvas material). The fill and the placeholder ink are the chrome's own tokens
// (--nova-chrome-field, --nova-chrome-ink-2), which material.spec.ts proves at 4.5:1 together: the
// label is visually hidden, so the placeholder is the only visible one. White is `on-primary`: the stock `white` is removed from
// the theme. The shared focus ring is the brand's; the white rim turning solid keeps focus visible
// on the dark chrome, where the brand alone would not be.
const field =
  'h-10 w-full rounded-md border border-on-primary/25 bg-(--nova-chrome-field) text-callout text-on-primary [color-scheme:dark] ' +
  'placeholder:text-[color:var(--nova-chrome-ink-2)] focus-visible:border-on-primary ' +
  'disabled:pointer-events-none disabled:opacity-50';

const adornment =
  'pointer-events-none absolute inset-y-0 flex items-center text-[color:var(--nova-chrome-ink-2)]';

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  function SearchField(
    {
      label,
      icon,
      shortcutHint,
      onValueChange,
      onChange,
      id,
      className,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      onChange?.(event);
      onValueChange?.(event.currentTarget.value);
    }

    return (
      <div className="relative">
        <label htmlFor={inputId}>
          <VisuallyHidden>{label}</VisuallyHidden>
        </label>
        {icon ? (
          <span aria-hidden="true" className={cx(adornment, 'left-4')}>
            {icon}
          </span>
        ) : null}
        <input
          {...rest}
          ref={ref}
          id={inputId}
          type="search"
          onChange={handleChange}
          className={cx(
            field,
            focusRing,
            icon ? 'pl-12' : 'pl-3',
            shortcutHint ? 'pr-16' : 'pr-3',
            className,
          )}
        />
        {shortcutHint ? (
          <span
            aria-hidden="true"
            className={cx(adornment, 'right-4 text-caption')}
          >
            {shortcutHint}
          </span>
        ) : null}
      </div>
    );
  },
);
