import { Card } from '@hos/nova-ui';
import type { TrainingWidgetProps } from './types';

export function TrainingWidget({
  patientId,
  compactMode,
  className,
}: TrainingWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Training Sandbox</h3>
        <p className="text-body text-ink-2">Curated workflow for Training Sandbox.</p>
      </div>
    </Card>
  );
}
