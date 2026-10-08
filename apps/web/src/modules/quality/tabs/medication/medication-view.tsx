import { Card } from '@hos/nova-ui';
import type { MedicationWidgetProps } from './types';

export function MedicationWidget({
  patientId,
  compactMode,
  className,
}: MedicationWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Medication Safety</h3>
        <p className="text-body text-ink-2">Curated workflow for Medication Safety.</p>
      </div>
    </Card>
  );
}
