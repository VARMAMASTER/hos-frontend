import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createMockDoctorSource } from './mock';
import type { DoctorDataSource } from './source';

// How the Doctor tabs get their data. A tab calls useDoctor() (or useDoctorQuery) and never imports
// mock.ts, so the real API client replaces the mock by being passed to DoctorDataProvider at the
// app's root, with no tab changing.

interface DoctorContextValue {
  source: DoctorDataSource;
  // The pause between the steps of an AI run's progress list ("Reading her charted values…"), in
  // milliseconds. A run is as slow as its steps; a spec passes 0.
  stepMs: number;
}

export const DEFAULT_STEP_MS = 450;

const DoctorContext = createContext<DoctorContextValue | null>(null);

export interface DoctorDataProviderProps {
  source: DoctorDataSource;
  stepMs?: number;
  children: ReactNode;
}

export function DoctorDataProvider({
  source,
  stepMs = DEFAULT_STEP_MS,
  children,
}: DoctorDataProviderProps) {
  return (
    <DoctorContext.Provider value={{ source, stepMs }}>
      {children}
    </DoctorContext.Provider>
  );
}

// Until the app mounts a provider (the real API is not built yet), the tabs share one in-memory
// mock, created on first use, so a note signed on one tab is still signed on the next.
let fallback: DoctorContextValue | null = null;

function useDoctorContext(): DoctorContextValue {
  const context = useContext(DoctorContext);
  if (context) return context;
  fallback ??= { source: createMockDoctorSource(), stepMs: DEFAULT_STEP_MS };
  return fallback;
}

export function useDoctor(): DoctorDataSource {
  return useDoctorContext().source;
}

export function useStepMs(): number {
  return useDoctorContext().stepMs;
}

export type DoctorQuery<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; data: T };

export interface DoctorQueryResult<T> {
  query: DoctorQuery<T>;
  source: DoctorDataSource;
  // Loads again from the start (the error state's "Try again").
  reload: () => void;
  // Changes the loaded data in place, after an action the source confirmed.
  update: (change: (data: T) => T) => void;
}

// Loads one tab's data from the source: loading, then ready or error.
export function useDoctorQuery<T>(
  load: (source: DoctorDataSource) => Promise<T>,
): DoctorQueryResult<T> {
  const source = useDoctor();
  const loadRef = useRef(load);
  loadRef.current = load;
  const [query, setQuery] = useState<DoctorQuery<T>>({ status: 'loading' });
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

export interface DoctorAction {
  busy: boolean;
  // What went wrong with the last action, in words for the doctor (the source's errors name the
  // problem, never the patient).
  error: string | null;
  clearError: () => void;
  run: <R>(task: () => Promise<R>) => Promise<R | undefined>;
}

// Runs one action at a time against the source (a signature, an approval), with its busy and error
// state. Nothing is logged: a failure is shown on screen and kept nowhere else.
export function useDoctorAction(): DoctorAction {
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
