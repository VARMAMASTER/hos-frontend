import { Card } from '@hos/nova-ui';
import type { AdmissionWidgetProps } from './types';

export function AdmissionWidget({
  patientId,
  compactMode,
  className,
}: AdmissionWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Admission</h3>
        <p className="text-body text-ink-2">Curated workflow for Admission.</p>
      </div>
    </Card>
  );
}
