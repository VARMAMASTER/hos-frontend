import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { focusRing } from '../../primitives/focus-ring';
import { Spinner } from '../../primitives/spinner';
import { disabledControl } from '../../primitives/states';
import { nextRovingIndex, RADIO_KEYS } from '../../primitives/roving-index';
import type { Size } from '../../primitives/types';
import {
  useChoiceValue,
  type ChoiceValueProps,
} from '../../primitives/use-choice-value';

export type ButtonGroupSize = Size;

interface RegisteredItem {
  element: HTMLElement;
  disabled: boolean;
}

interface ButtonGroupContextValue {
  multiple: boolean;
  size: ButtonGroupSize;
  selected: readonly string[];
  choose: (value: string) => void;
  disabled: boolean;
  // The one radio that takes part in the page's Tab order (single select only).
  tabStop: string;
  register: (
    value: string,
    element: HTMLElement,
    disabled: boolean,
  ) => () => void;
  // True while the sliding indicator is drawn, so the selected segment leaves its fill to it.
  indicatorDrawn: boolean;
}

// Internal: the items share the selection through it, so callers only ever use the two parts.
const ButtonGroupContext = createContext<ButtonGroupContextValue | null>(null);

function useButtonGroup(): ButtonGroupContextValue {
  const context = useContext(ButtonGroupContext);
  if (context === null) {
    throw new Error('<ButtonGroupItem> must be rendered inside <ButtonGroup>.');
  }
  return context;
}

// The selected radio is the tab stop, as long as it is an enabled item of this group. Otherwise
// (nothing selected, or the selected one disabled) the first enabled item is, so the group can always
// be reached with Tab.
function pickTabStop(
  selected: string | undefined,
  items: ReadonlyMap<string, RegisteredItem>,
): string {
  const enabled = Array.from(items)
    .filter(([, item]) => !item.disabled)
    .sort(([, a], [, b]) =>
      a.element.compareDocumentPosition(b.element) &
      Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
    )
    .map(([value]) => value);
  if (selected !== undefined && enabled.includes(selected)) return selected;
  return enabled[0] ?? '';
}

type GroupBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'defaultValue' | 'role'
> & {
  children: ReactNode;
  size?: ButtonGroupSize;
  disabled?: boolean;
};

// Single (the default): value is a string. Multiple: value is a string[]. Either is controlled by
// `value` and uncontrolled from `defaultValue`. Give the group an aria-label (or aria-labelledby).
export type ButtonGroupProps = GroupBaseProps & ChoiceValueProps;

interface Box {
  left: number;
  width: number;
}

// The Material 3 Expressive connected button group: segments a hair apart, not one fused bar. Single
// select is a radio group (role radiogroup, roving tabindex, arrow keys, Home and End), and its
// selected segment has a pill fill that slides to the next one. Multiple select is a group of toggle
// buttons (aria-pressed). The selected segment's corners morph from soft to a pill.
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  function ButtonGroup(
    {
      type,
      value,
      defaultValue,
      onValueChange,
      size = 'md',
      disabled = false,
      className,
      children,
      ...rest
    },
    forwardedRef,
  ) {
    const { multiple, selected, choose } = useChoiceValue({
      type,
      value,
      defaultValue,
      onValueChange,
    } as ChoiceValueProps);

    const groupRef = useRef<HTMLDivElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        groupRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    // The items register (element and disabled state), so the group knows which radio can be the
    // tab stop without the caller listing them twice.
    const items = useRef(new Map<string, RegisteredItem>());
    const [, setRegistrations] = useState(0);
    const register = useCallback(
      (itemValue: string, element: HTMLElement, itemDisabled: boolean) => {
        items.current.set(itemValue, { element, disabled: itemDisabled });
        setRegistrations((count) => count + 1);
        return () => {
          if (items.current.get(itemValue)?.element === element) {
            items.current.delete(itemValue);
          }
          setRegistrations((count) => count + 1);
        };
      },
      [],
    );

    // The indicator is the selected radio's box, measured from its offsets, so it follows the segment
    // whatever its label's width. Nothing is drawn where there is no layout (no selection, or a
    // renderer without one), and the segment then keeps its own fill.
    const [box, setBox] = useState<Box | null>(null);
    const [animated, setAnimated] = useState(false);
    const measure = useCallback(() => {
      const group = groupRef.current;
      const current = group?.querySelector<HTMLElement>(
        '[role="radio"][aria-checked="true"]',
      );
      const next =
        current && current.offsetWidth > 0
          ? { left: current.offsetLeft, width: current.offsetWidth }
          : null;
      setBox((previous) =>
        previous?.left === next?.left && previous?.width === next?.width
          ? previous
          : next,
      );
    }, []);
    // Every render: the selection, the labels and the size may all have moved the segment.
    useLayoutEffect(() => {
      if (!multiple) measure();
    });
    useEffect(() => {
      const group = groupRef.current;
      if (multiple || !group || typeof ResizeObserver === 'undefined') {
        return undefined;
      }
      const observer = new ResizeObserver(measure);
      observer.observe(group);
      return () => observer.disconnect();
    }, [multiple, measure]);
    // The first placement must not slide in from nowhere: transitions switch on after it.
    useEffect(() => {
      if (box !== null) setAnimated(true);
    }, [box]);

    const indicatorDrawn = !multiple && box !== null;
    return (
      <ButtonGroupContext
        value={{
          multiple,
          size,
          selected,
          choose,
          disabled,
          tabStop: pickTabStop(selected[0], items.current),
          register,
          indicatorDrawn,
        }}
      >
        <div
          {...rest}
          ref={setRefs}
          role={multiple ? 'group' : 'radiogroup'}
          aria-disabled={disabled || undefined}
          data-size={size}
          className={cx('relative inline-flex items-stretch gap-s0', className)}
        >
          {indicatorDrawn ? (
            <span
              aria-hidden="true"
              data-slot="indicator"
              style={{
                width: box.width,
                transform: `translateX(${box.left}px)`,
              }}
              // The highlight edge rides on the indicator, so it slides with the fill.
              className={cx(
                'nova-highlight-edge pointer-events-none absolute inset-y-0 left-0 rounded-overlay bg-primary',
                animated &&
                  'motion-safe:transition-[transform,width] motion-safe:duration-base motion-safe:ease-standard',
              )}
            />
          ) : null}
          {children}
        </div>
      </ButtonGroupContext>
    );
  },
);

type ItemBaseProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'type' | 'role' | 'children' | 'aria-pressed' | 'aria-checked'
> & {
  value: string;
  // A leading glyph, hidden from assistive technology: the label (or aria-label) names the item.
  icon?: ReactNode;
  loading?: boolean;
};

// With a label, the label names the item. Without one (an icon-only item), an aria-label must.
export type ButtonGroupItemProps = ItemBaseProps &
  ({ children: ReactNode } | { children?: undefined; 'aria-label': string });

// Height, padding and type match Button (the control tokens: sm 6px by 10px at 12px, md 8px by 16px
// at 13px, so min-h-control-sm | md is the height they come to anyway).
// Icon-only items are square: padding all round, and the glyph 16px (size-icon-md). The prototype's 18px radius step makes a 30 to 36px
// tall segment a full pill, which is why the selected corners morph to rounded-overlay and not rounded-full:
// animating a radius to 999px finishes in its first percent and shows no morph.
const sizes: Record<ButtonGroupSize, { text: string; iconOnly: string }> = {
  sm: {
    text: 'min-h-control-sm px-control-sm py-control-sm text-label',
    iconOnly: 'p-s2',
  },
  md: {
    text: 'min-h-control-md px-control-md py-control-md text-control',
    iconOnly: 'p-s3',
  },
};

export function ButtonGroupItem({
  value,
  icon,
  className,
  children,
  disabled: disabledProp = false,
  loading = false,
  onClick,
  onKeyDown,
  ...rest
}: ButtonGroupItemProps) {
  const group = useButtonGroup();
  const ref = useRef<HTMLButtonElement>(null);
  const disabled = disabledProp || group.disabled || loading;
  const selected = group.selected.includes(value);
  const iconOnly = children === undefined || children === null;

  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    return group.register(value, ref.current, disabled);
  }, [group.register, value, disabled]);

  // Arrow keys move between the enabled radios of this item's own group, Home and End jump to the
  // ends, and the radio that gets focus is chosen (a radio group selects as it moves). Choosing goes
  // through the item's own click handler, so there is one path that selects.
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      group.multiple ||
      !(RADIO_KEYS as readonly string[]).includes(event.key)
    ) {
      return;
    }
    const list = event.currentTarget.closest('[role="radiogroup"]');
    if (list === null) return;
    const radios = Array.from(
      list.querySelectorAll<HTMLElement>('[role="radio"]:not(:disabled)'),
    );
    const current = radios.indexOf(event.currentTarget);
    if (current === -1) return;
    event.preventDefault();
    const target =
      radios[nextRovingIndex(event.key, current, radios.length - 1)];
    if (target === event.currentTarget) return;
    target.focus();
    target.click();
  }

  // The indicator paints the fill and the highlight edge once it is drawn; until then (and for a
  // pressed toggle, which has no indicator) the segment fills itself and carries the edge. An
  // unselected segment's edge hovers to the highlight. The tick or aria state says the same.
  const fill = selected
    ? group.multiple || !group.indicatorDrawn
      ? 'relative nova-highlight-edge rounded-overlay border-primary bg-primary text-on-primary'
      : 'rounded-overlay border-primary bg-transparent text-on-primary'
    : 'rounded-control border-border-control bg-surface text-ink-2 hover:border-highlight-hover hover:bg-surface-2 hover:text-ink';

  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      role={group.multiple ? undefined : 'radio'}
      aria-checked={group.multiple ? undefined : selected}
      aria-pressed={group.multiple ? selected : undefined}
      tabIndex={group.multiple ? undefined : value === group.tabStop ? 0 : -1}
      disabled={disabled}
      data-value={value}
      data-size={group.size}
      data-selected={selected ? 'true' : undefined}
      aria-busy={loading || undefined}
      onClick={(event) => {
        onClick?.(event);
        // A disabled <button> never reaches here: React drops its clicks.
        if (event.defaultPrevented || loading) return;
        group.choose(value);
      }}
      onKeyDown={handleKeyDown}
      className={cx(
        'relative inline-flex cursor-pointer items-center justify-center gap-s2 whitespace-nowrap border font-semibold',
        loading && 'cursor-progress',
        iconOnly
          ? cx(sizes[group.size].iconOnly, '[&_svg]:size-icon-md')
          : sizes[group.size].text,
        'motion-safe:transition-[color,background-color,border-color,border-radius,transform] motion-safe:duration-base motion-safe:ease-standard motion-safe:active:scale-95',
        fill,
        focusRing,
        disabledControl,
        className,
      )}
    >
      {/* The content sits above the sliding indicator, which is a positioned sibling. */}
      <span
        className={cx(
          'relative z-10 inline-flex items-center gap-s2',
          loading && 'opacity-0',
        )}
      >
        {group.multiple && !iconOnly ? (
          // A pressed multiple-select segment slides a tick in, so the state is never colour alone.
          <span
            aria-hidden="true"
            data-slot="tick"
            data-state={selected ? 'on' : 'off'}
            className={cx(
              'inline-flex shrink-0 overflow-hidden motion-safe:transition-[max-width,margin,opacity,transform] motion-safe:duration-base motion-safe:ease-standard',
              selected
                ? 'mr-0 max-w-s6 translate-x-0 opacity-100'
                : '-mr-s2 max-w-0 -translate-x-s3 opacity-0',
            )}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
              className="size-icon-sm shrink-0"
            >
              <path d="M4.5 10.5l3.5 3.5 7.5-8" />
            </svg>
          </span>
        ) : null}
        {icon ? (
          <span
            aria-hidden="true"
            data-slot="icon"
            className="inline-flex shrink-0 items-center [&_svg]:size-icon-md"
          >
            {icon}
          </span>
        ) : null}
        {children}
      </span>
      {loading ? <Spinner size={group.size === 'sm' ? 'sm' : 'md'} /> : null}
    </button>
  );
}
