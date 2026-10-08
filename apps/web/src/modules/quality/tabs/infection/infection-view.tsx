import { Card } from '@hos/nova-ui';
import type { InfectionWidgetProps } from './types';

export function InfectionWidget({
  patientId,
  compactMode,
  className,
}: InfectionWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Infection Control</h3>
        <p className="text-body text-ink-2">Curated workflow for Infection Control.</p>
      </div>
    </Card>
  );
}
