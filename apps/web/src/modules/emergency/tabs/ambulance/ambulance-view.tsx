import { Card } from '@hos/nova-ui';
import type { AmbulanceWidgetProps } from './types';

export function AmbulanceWidget({
  patientId,
  compactMode,
  className,
}: AmbulanceWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Ambulance</h3>
        <p className="text-body text-ink-2">Curated workflow for Ambulance.</p>
      </div>
    </Card>
  );
}
