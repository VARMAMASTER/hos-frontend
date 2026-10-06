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
// It is the prototype's .topbar-search: 13px type, 8px by 10px, a faint white rim (its 10px radius
// is off the --r-* scale, so sm); focused, the rim turns the chrome accent.
const field =
  'w-full rounded-sm border border-chrome-ink/15 bg-(--nova-chrome-field) py-2 text-[13px] text-on-primary [color-scheme:dark] ' +
  'placeholder:text-[color:var(--nova-chrome-ink-2)] focus-visible:border-chrome-accent/60 ' +
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
          <span
            aria-hidden="true"
            className={cx(adornment, 'left-2.5 [&_svg]:size-[15px]')}
          >
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
            icon ? 'pl-8' : 'pl-2.5',
            shortcutHint ? 'pr-12' : 'pr-2.5',
            className,
          )}
        />
        {shortcutHint ? (
          <span aria-hidden="true" className={cx(adornment, 'right-2.5')}>
            {/* The prototype's kbd hint: IBM Plex Mono at 10.5px on a faint white key. */}
            <span className="rounded-sm border border-chrome-ink/20 bg-chrome-ink/10 px-1.5 py-px font-mono text-[10.5px]">
              {shortcutHint}
            </span>
          </span>
        ) : null}
      </div>
    );
  },
);
