import { Card } from '@hos/nova-ui';
import type { PatientsWidgetProps } from './types';

export function PatientsWidget({
  patientId,
  compactMode,
  className,
}: PatientsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">My Patients</h3>
        <p className="text-body text-ink-2">Curated workflow for My Patients.</p>
      </div>
    </Card>
  );
}
