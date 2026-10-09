import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { ReceptionDataProvider, type ReceptionDataSource } from '../data';
import { createMockReceptionSource } from '../data/mock';

// Test helpers for the Reception tab specs (not part of the app bundle: only specs import this).

// A source that never answers, for the loading state.
export function pending<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

// The mock source with some methods replaced: a stub for the loading, empty and error states.
export function stubSource(
  overrides: Partial<ReceptionDataSource> = {},
): ReceptionDataSource {
  return { ...createMockReceptionSource(), ...overrides };
}

// Renders a tab against a source (a fresh mock unless one is given).
export function renderTab(
  ui: ReactElement,
  source: ReceptionDataSource = createMockReceptionSource(),
): RenderResult & { source: ReceptionDataSource } {
  return {
    source,
    ...render(
      <ReceptionDataProvider source={source}>{ui}</ReceptionDataProvider>,
    ),
  };
}
