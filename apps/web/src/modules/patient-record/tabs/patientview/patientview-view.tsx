import { Card } from '@hos/nova-ui';
import type { PatientviewWidgetProps } from './types';

export function PatientviewWidget({
  patientId,
  compactMode,
  className,
}: PatientviewWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Patient View</h3>
        <p className="text-body text-ink-2">Curated workflow for Patient View.</p>
      </div>
    </Card>
  );
}
