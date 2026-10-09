import { useCallback, useEffect, useRef, useState } from 'react';
import { useStepMs } from '../data';

export type AiRunPhase = 'idle' | 'running' | 'done' | 'error';

export interface AiRun<T> {
  phase: AiRunPhase;
  // How many of the steps are finished: the step list shows that many ticked, the next one running.
  stepIndex: number;
  result: T | null;
  error: string | null;
  start: () => void;
  reset: () => void;
}

interface RunState<T> {
  phase: AiRunPhase;
  stepIndex: number;
  result: T | null;
  error: string | null;
}

const IDLE = {
  phase: 'idle',
  stepIndex: 0,
  result: null,
  error: null,
} as const;

// An AI run the way the prototype shows one (HOS.aiProgress): a list of steps ticks through while
// the source works, and the result appears when both are finished. The steps are pacing for the
// person watching, not a measure of the work: the pause between them is DoctorDataProvider's stepMs.
// Nothing here is final: every result goes on screen as a draft for a person to approve.
export function useAiRun<T>(
  task: () => Promise<T>,
  stepCount: number,
): AiRun<T> {
  const stepMs = useStepMs();
  const [state, setState] = useState<RunState<T>>(IDLE);
  const alive = useRef(true);
  const current = useRef(0);
  const taskRef = useRef(task);
  taskRef.current = task;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const start = useCallback(() => {
    const id = ++current.current;
    setState({ phase: 'running', stepIndex: 0, result: null, error: null });
    let outcome: { value: T } | { failure: string } | null = null;
    let stepsDone = stepCount === 0;
    const live = () => alive.current && id === current.current;
    const finish = () => {
      if (!live() || !outcome || !stepsDone) return;
      setState(
        'value' in outcome
          ? {
              phase: 'done',
              stepIndex: stepCount,
              result: outcome.value,
              error: null,
            }
          : {
              phase: 'error',
              stepIndex: stepCount,
              result: null,
              error: outcome.failure,
            },
      );
    };
    taskRef.current().then(
      (value) => {
        outcome = { value };
        finish();
      },
      (failure: unknown) => {
        outcome = {
          failure:
            failure instanceof Error
              ? failure.message
              : 'That did not go through.',
        };
        finish();
      },
    );
    let step = 0;
    const tick = () => {
      if (!live()) return;
      step += 1;
      if (step >= stepCount) {
        stepsDone = true;
        setState((now) => ({ ...now, stepIndex: stepCount }));
        finish();
        return;
      }
      setState((now) => ({ ...now, stepIndex: step }));
      setTimeout(tick, stepMs);
    };
    if (stepCount > 0) setTimeout(tick, stepMs);
  }, [stepCount, stepMs]);

  const reset = useCallback(() => {
    current.current += 1;
    setState(IDLE);
  }, []);

  return { ...state, start, reset };
}
