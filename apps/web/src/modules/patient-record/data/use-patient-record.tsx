import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createMockPatientRecordSource } from './mock';
import type { PatientRecordDataSource } from './source';

// How the Patient record tabs get their data. A tab calls usePatientRecord() (or
// usePatientRecordQuery) and never imports mock.ts, so the real API client replaces the mock by
// being passed to PatientRecordDataProvider at the app's root, with no tab changing.

const PatientRecordContext = createContext<PatientRecordDataSource | null>(
  null,
);

export interface PatientRecordDataProviderProps {
  source: PatientRecordDataSource;
  children: ReactNode;
}

export function PatientRecordDataProvider({
  source,
  children,
}: PatientRecordDataProviderProps) {
  return (
    <PatientRecordContext.Provider value={source}>
      {children}
    </PatientRecordContext.Provider>
  );
}

// Until the app mounts a provider (the real API is not built yet), the tabs share one in-memory
// mock, created on first use, so a care gap ordered on one tab is still ordered on the next.
let fallbackSource: PatientRecordDataSource | null = null;

export function usePatientRecord(): PatientRecordDataSource {
  const source = useContext(PatientRecordContext);
  if (source) return source;
  fallbackSource ??= createMockPatientRecordSource();
  return fallbackSource;
}

export type PatientRecordQuery<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; data: T };

export interface PatientRecordQueryResult<T> {
  query: PatientRecordQuery<T>;
  source: PatientRecordDataSource;
  // Loads again from the start (the error state's "Try again").
  reload: () => void;
  // Changes the loaded data in place, after an action the source confirmed.
  update: (change: (data: T) => T) => void;
}

// Loads one tab's data from the source: loading, then ready or error. patientId is the chart the
// widget was given; left out, the source means the chart that is open.
export function usePatientRecordQuery<T>(
  load: (source: PatientRecordDataSource, patientId?: string) => Promise<T>,
  patientId?: string,
): PatientRecordQueryResult<T> {
  const source = usePatientRecord();
  const loadRef = useRef(load);
  loadRef.current = load;
  const [query, setQuery] = useState<PatientRecordQuery<T>>({
    status: 'loading',
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    loadRef.current(source, patientId).then(
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
  }, [source, patientId, attempt]);

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

export interface PatientRecordAction {
  busy: boolean;
  // What went wrong with the last action, in words for the clinician (the source's errors name the
  // problem, never the patient).
  error: string | null;
  clearError: () => void;
  run: <R>(task: () => Promise<R>) => Promise<R | undefined>;
}

// Runs one action at a time against the source (an order, an approval), with its busy and error
// state. Nothing is logged: a failure is shown on screen and kept nowhere else.
export function usePatientRecordAction(): PatientRecordAction {
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
