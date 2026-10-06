import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type FieldsetHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { Surface } from '../../primitives/surface';
import {
  useChoiceValue,
  type ChoiceValueProps,
} from '../button-group/use-choice-value';
import { CheckboxBox } from '../checkbox/checkbox-box';
import { RadioDot } from '../radio/radio-dot';

interface ChoiceCardGroupContextValue {
  multiple: boolean;
  name: string;
  disabled: boolean;
  selected: readonly string[];
  choose: (value: string) => void;
}

// Internal: a card inside a group takes its type, name and state from it.
const ChoiceCardGroupContext =
  createContext<ChoiceCardGroupContextValue | null>(null);

export interface ChoiceCardProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'title' | 'value'
  > {
  // What this card stands for in its group (and the form value when sent).
  value?: string;
  // One choice among several (a radio, the default) or an independent one (a checkbox).
  type?: 'radio' | 'checkbox';
  title: ReactNode;
  description?: ReactNode;
  // A leading glyph, hidden from assistive technology: the title names the card.
  icon?: ReactNode;
  // Something to say beside the title ("Most common", a Chip). Not part of the card's name.
  badge?: ReactNode;
}

// A larger option for a question that needs more than a label ("Admission type"). The whole card is
// one <label>, so one click target, around a real radio or checkbox input; the input is named by the
// title and described by the description. Chosen, it gets a tinted fill (a fading overlay) and a
// primary edge, both from the checked input via :has, and the radio dot or tick itself, so the state
// is never colour alone. It is the prototype's card (opaque under glass and solid, radius md); the
// keyboard is the platform's radio and checkbox keyboard, which is why the input stays in the page.
// The card's focus ring is the input's: it shows a ring on the dot or box.
export const ChoiceCard = forwardRef<HTMLInputElement, ChoiceCardProps>(
  function ChoiceCard(
    {
      type = 'radio',
      title,
      description,
      icon,
      badge,
      className,
      disabled: disabledProp,
      name: nameProp,
      value,
      checked,
      defaultChecked,
      onChange,
      ...rest
    },
    ref,
  ) {
    const group = useContext(ChoiceCardGroupContext);
    const titleId = useId();
    const descriptionId = useId();
    const disabled = disabledProp ?? group?.disabled ?? false;
    const kind = group ? (group.multiple ? 'checkbox' : 'radio') : type;

    // Inside a group the group owns the state: the card shows it and asks the group to change it.
    const state =
      group && value !== undefined
        ? {
            name: group.name,
            checked: group.selected.includes(value),
            onChange: (event: Parameters<NonNullable<typeof onChange>>[0]) => {
              onChange?.(event);
              group.choose(value);
            },
          }
        : { name: nameProp, checked, defaultChecked, onChange };

    const input = {
      ...rest,
      ...state,
      value,
      id: undefined,
      disabled,
      'aria-labelledby': titleId,
      'aria-describedby': description ? descriptionId : undefined,
    };

    return (
      <Surface
        as="label"
        material="card"
        radius="md"
        className={cx(
          'group relative flex items-start gap-3 p-4',
          'has-checked:[--nova-card-edge:var(--nova-color-primary)]',
          'motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          className,
        )}
      >
        {/* The tint is an overlay, so choosing fades it in instead of swapping the card's fill. */}
        <span
          aria-hidden="true"
          data-slot="tint"
          className={cx(
            'nova-radius-inherit pointer-events-none absolute inset-0 bg-primary-ghost opacity-0',
            'group-has-checked:opacity-100 motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out',
          )}
        />
        {kind === 'checkbox' ? (
          <CheckboxBox ref={ref} boxClassName="mt-0.5" {...input} />
        ) : (
          <RadioDot ref={ref} boxClassName="mt-0.5" {...input} />
        )}
        {icon ? (
          <span
            aria-hidden="true"
            data-slot="icon"
            className="relative inline-grid size-8 shrink-0 place-items-center rounded-sm bg-primary-soft text-primary-strong [&_svg]:size-5"
          >
            {icon}
          </span>
        ) : null}
        <span className="relative flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <span id={titleId} className="text-[13.5px] font-semibold text-ink">
              {title}
            </span>
            {badge}
          </span>
          {description ? (
            <span id={descriptionId} className="text-[12.5px] text-ink-2">
              {description}
            </span>
          ) : null}
        </span>
      </Surface>
    );
  },
);

type ChoiceCardGroupBaseProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'children' | 'defaultValue' | 'name'
> & {
  // The question: the fieldset's accessible name.
  legend: ReactNode;
  // The form name every input in the group shares.
  name: string;
  children: ReactNode;
  // Cards per row from the sm breakpoint; one on a phone. Default 1.
  columns?: 1 | 2 | 3;
};

export type ChoiceCardGroupProps = ChoiceCardGroupBaseProps & ChoiceValueProps;

const columnClasses = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
} as const;

// A <fieldset> with a <legend> around a set of ChoiceCards, holding their value: one string for a
// single choice (the default), an array with type="multiple". Controlled by `value`, uncontrolled from
// `defaultValue`. The cards are real radios sharing one name (or checkboxes), so Tab, the arrow keys
// and Space are the platform's.
export const ChoiceCardGroup = forwardRef<
  HTMLFieldSetElement,
  ChoiceCardGroupProps
>(function ChoiceCardGroup(
  {
    type,
    value,
    defaultValue,
    onValueChange,
    legend,
    name,
    columns = 1,
    disabled = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  const { multiple, selected, choose } = useChoiceValue({
    type,
    value,
    defaultValue,
    onValueChange,
  } as ChoiceValueProps);
  return (
    <ChoiceCardGroupContext
      value={{ multiple, name, disabled, selected, choose }}
    >
      <fieldset
        {...rest}
        ref={ref}
        disabled={disabled}
        className={cx('min-w-0', className)}
      >
        <legend className="mb-2 text-[13px] font-semibold text-ink">
          {legend}
        </legend>
        <div
          data-slot="cards"
          className={cx('grid gap-3', columnClasses[columns])}
        >
          {children}
        </div>
      </fieldset>
    </ChoiceCardGroupContext>
  );
});
