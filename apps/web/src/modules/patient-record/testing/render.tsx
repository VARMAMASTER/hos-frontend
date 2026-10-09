import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { vi } from 'vitest';
import {
  PatientRecordDataProvider,
  type PatientRecordDataSource,
} from '../data';
import { createMockPatientRecordSource } from '../data/mock';

// Test helpers for the Patient record specs (not part of the app bundle: only specs import this).

// A source that never answers, for the loading state.
export function pending<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

// The mock source with some methods replaced: a stub for the loading, empty and error states.
export function stubSource(
  overrides: Partial<PatientRecordDataSource> = {},
): PatientRecordDataSource {
  return { ...createMockPatientRecordSource(), ...overrides };
}

// Renders a tab against a source (a fresh mock unless one is given).
export function renderTab(
  ui: ReactElement,
  source: PatientRecordDataSource = createMockPatientRecordSource(),
): RenderResult & { source: PatientRecordDataSource } {
  return {
    source,
    ...render(
      <PatientRecordDataProvider source={source}>
        {ui}
      </PatientRecordDataProvider>,
    ),
  };
}

// jsdom has no layout and no ResizeObserver, and the charts' ResponsiveContainer measures its
// parent. The stub reports a fixed box as soon as it is observed, so a chart really renders.
export class FixedResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ target, contentRect: { width: 600, height: 300 } }] as never,
      this as never,
    );
  }
  unobserve() {
    // Nothing to release.
  }
  disconnect() {
    // Nothing to release.
  }
}

export function stubResizeObserver() {
  vi.stubGlobal('ResizeObserver', FixedResizeObserver);
}
