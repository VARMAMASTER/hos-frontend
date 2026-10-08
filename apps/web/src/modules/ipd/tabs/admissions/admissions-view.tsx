import { Card } from '@hos/nova-ui';
import type { AdmissionsWidgetProps } from './types';

export function AdmissionsWidget({
  patientId,
  compactMode,
  className,
}: AdmissionsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Admissions</h3>
        <p className="text-body text-ink-2">Curated workflow for Admissions.</p>
      </div>
    </Card>
  );
}
