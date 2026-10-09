// Results are copies, so a caller editing what it got back cannot change the source's state.
export function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// The state the mock's areas share. openToken is whose chart is open: patient-scoped tabs read it,
// and only the queue changes it. The rest is what the doctor has signed, so a later tab shows it.
export interface MockState {
  openToken: string;
  // Lakshmi Devi's consultation note has been signed (the Progress Notes list shows it filed).
  consultNoteSigned: boolean;
}

// The chart the clinical tabs hold is Lakshmi Devi's (T-12); any other patient has none prepared.
export const CHART_TOKEN = 'T-12';

export function chartIsOpen(state: MockState): boolean {
  return state.openToken === CHART_TOKEN;
}
