import { Card } from '@hos/nova-ui';
import type { DischargeWidgetProps } from './types';

export function DischargeWidget({
  patientId,
  compactMode,
  className,
}: DischargeWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Discharge</h3>
        <p className="text-body text-ink-2">Curated workflow for Discharge.</p>
      </div>
    </Card>
  );
}
