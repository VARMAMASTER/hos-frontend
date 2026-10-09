// Results are copies, so a caller editing what it got back cannot change the source's state.
export function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// The state the mock's areas share: whose chart is open. Patient-scoped tabs read it; only the
// queue changes it.
export interface MockState {
  openToken: string;
}
