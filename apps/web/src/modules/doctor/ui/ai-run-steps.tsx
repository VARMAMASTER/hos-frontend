import { AiProgressSteps } from '@hos/nova-ui';
import type { AiRun } from './use-ai-run';

export interface AiRunStepsProps {
  steps: string[];
  run: Pick<AiRun<unknown>, 'phase' | 'stepIndex'>;
  // Names the list for assistive technology ("Reference check progress").
  label: string;
}

// The step list of an AI run while it works; nothing once it has finished.
export function AiRunSteps({ steps, run, label }: AiRunStepsProps) {
  if (run.phase !== 'running') return null;
  return (
    <AiProgressSteps steps={steps} currentIndex={run.stepIndex} label={label} />
  );
}
