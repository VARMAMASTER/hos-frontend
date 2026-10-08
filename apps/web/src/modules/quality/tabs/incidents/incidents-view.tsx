import { Card } from '@hos/nova-ui';
import type { IncidentsWidgetProps } from './types';

export function IncidentsWidget({
  patientId,
  compactMode,
  className,
}: IncidentsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Incidents</h3>
        <p className="text-body text-ink-2">Curated workflow for Incidents.</p>
      </div>
    </Card>
  );
}
