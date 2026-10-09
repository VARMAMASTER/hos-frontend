import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { vi } from 'vitest';
import { DoctorDataProvider, type DoctorDataSource } from '../data';
import { createMockDoctorSource } from '../data/mock';

// Test helpers for the Doctor tab specs (not part of the app bundle: only specs import this).

// A source that never answers, for the loading state.
export function pending<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

// The mock source with some methods replaced: a stub for the loading, empty and error states.
export function stubSource(
  overrides: Partial<DoctorDataSource> = {},
): DoctorDataSource {
  return { ...createMockDoctorSource(), ...overrides };
}

// jsdom has no layout and no ResizeObserver, and Recharts' ResponsiveContainer measures its parent.
// The stub reports a fixed box as soon as it is observed, so a chart really renders.
class FixedResizeObserver {
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

// For a spec of a tab with a chart: call it in beforeEach, and vi.unstubAllGlobals() in afterEach.
export function stubChartLayout() {
  vi.stubGlobal('ResizeObserver', FixedResizeObserver);
}

// Renders a tab against a source (a fresh mock unless one is given), with the AI progress steps at
// no pause so a run finishes as soon as its source answers.
export function renderTab(
  ui: ReactElement,
  source: DoctorDataSource = createMockDoctorSource(),
): RenderResult & { source: DoctorDataSource } {
  return {
    source,
    ...render(
      <DoctorDataProvider source={source} stepMs={0}>
        {ui}
      </DoctorDataProvider>,
    ),
  };
}
