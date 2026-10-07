import { useControllableState } from './use-controllable-state';

// The value contract ButtonGroup and ChoiceCardGroup share: one string when a single choice is
// allowed (the default), an array of strings when several are. Controlled when `value` is given,
// uncontrolled from `defaultValue` otherwise, as everywhere in Nova.
export type ChoiceValueProps =
  | {
      type?: 'single';
      value?: string;
      defaultValue?: string;
      onValueChange?: (value: string) => void;
    }
  | {
      type: 'multiple';
      value?: string[];
      defaultValue?: string[];
      onValueChange?: (value: string[]) => void;
    };

function toArray(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  return value === '' ? [] : [value];
}

export interface ChoiceValue {
  multiple: boolean;
  // Always an array; a single choice is zero or one entries.
  selected: readonly string[];
  // Picks `value`: a single group selects it (and says nothing if it already is); a multiple group
  // toggles it, keeping the order the choices were made in.
  choose: (value: string) => void;
}

export function useChoiceValue(props: ChoiceValueProps): ChoiceValue {
  const multiple = props.type === 'multiple';
  const [selected, setSelected] = useControllableState<string[]>({
    value: toArray(props.value),
    defaultValue: toArray(props.defaultValue) ?? [],
    onChange: (next) => {
      if (props.type === 'multiple') props.onValueChange?.(next);
      else props.onValueChange?.(next[0] ?? '');
    },
  });
  function choose(value: string) {
    if (multiple) {
      setSelected(
        selected.includes(value)
          ? selected.filter((entry) => entry !== value)
          : [...selected, value],
      );
    } else if (selected[0] !== value) {
      setSelected([value]);
    }
  }
  return { multiple, selected, choose };
}
