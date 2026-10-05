import { useCallback, useState } from 'react';

export interface ControllableStateOptions<T> {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}

// One implementation of controlled-or-uncontrolled state for Tabs, Menu, Dialog, Switch and every
// other stateful component. Controlled when `value` is given: the component reports changes and
// the caller decides. Uncontrolled otherwise: the component keeps its own state.
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInternal(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [controlled ? value : internal, set];
}
