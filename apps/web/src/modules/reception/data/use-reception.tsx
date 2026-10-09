import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createMockReceptionSource } from './mock';
import type { ReceptionDataSource } from './source';

// How the Reception tabs get their data. A tab calls useReception() (or useReceptionQuery) and never
// imports mock.ts, so the real API client replaces the mock by being passed to
// ReceptionDataProvider at the app's root, with no tab changing.

const ReceptionContext = createContext<ReceptionDataSource | null>(null);

export interface ReceptionDataProviderProps {
  source: ReceptionDataSource;
  children: ReactNode;
}

export function ReceptionDataProvider({
  source,
  children,
}: ReceptionDataProviderProps) {
  return (
    <ReceptionContext.Provider value={source}>
      {children}
    </ReceptionContext.Provider>
  );
}

// Until the app mounts a provider (the real API is not built yet), the tabs share one in-memory
// mock, created on first use, so a booking made on one tab is still there on the next.
let fallbackSource: ReceptionDataSource | null = null;

export function useReception(): ReceptionDataSource {
  const source = useContext(ReceptionContext);
  if (source) return source;
  fallbackSource ??= createMockReceptionSource();
  return fallbackSource;
}

export type ReceptionQuery<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; data: T };

export interface ReceptionQueryResult<T> {
  query: ReceptionQuery<T>;
  source: ReceptionDataSource;
  // Loads again from the start (the error state's "Try again").
  reload: () => void;
  // Changes the loaded data in place, after an action the source confirmed.
  update: (change: (data: T) => T) => void;
}

// Loads one tab's data from the source: loading, then ready or error.
export function useReceptionQuery<T>(
  load: (source: ReceptionDataSource) => Promise<T>,
): ReceptionQueryResult<T> {
  const source = useReception();
  const loadRef = useRef(load);
  loadRef.current = load;
  const [query, setQuery] = useState<ReceptionQuery<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    loadRef.current(source).then(
      (data) => {
        if (active) setQuery({ status: 'ready', data });
      },
      (error: unknown) => {
        if (active) {
          setQuery({
            status: 'error',
            error:
              error instanceof Error ? error : new Error('Something failed.'),
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [source, attempt]);

  const reload = useCallback(() => {
    setQuery({ status: 'loading' });
    setAttempt((count) => count + 1);
  }, []);

  const update = useCallback((change: (data: T) => T) => {
    setQuery((current) =>
      current.status === 'ready'
        ? { status: 'ready', data: change(current.data) }
        : current,
    );
  }, []);

  return { query, source, reload, update };
}

export interface ReceptionAction {
  busy: boolean;
  // What went wrong with the last action, in words for the front desk (the source's errors name the
  // problem, never the patient).
  error: string | null;
  clearError: () => void;
  run: <R>(task: () => Promise<R>) => Promise<R | undefined>;
}

// Runs one action at a time against the source (a booking, an approval), with its busy and error
// state. Nothing is logged: a failure is shown on screen and kept nowhere else.
export function useReceptionAction(): ReceptionAction {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async <R,>(task: () => Promise<R>) => {
    setBusy(true);
    setError(null);
    try {
      return await task();
    } catch (failure: unknown) {
      if (mounted.current) {
        setError(
          failure instanceof Error
            ? failure.message
            : 'That did not go through.',
        );
      }
      return undefined;
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { busy, error, clearError, run };
}
