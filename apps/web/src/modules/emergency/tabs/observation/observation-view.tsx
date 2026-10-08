import { Card } from '@hos/nova-ui';
import type { ObservationWidgetProps } from './types';

export function ObservationWidget({
  patientId,
  compactMode,
  className,
}: ObservationWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Observation</h3>
        <p className="text-body text-ink-2">Curated workflow for Observation.</p>
      </div>
    </Card>
  );
}
