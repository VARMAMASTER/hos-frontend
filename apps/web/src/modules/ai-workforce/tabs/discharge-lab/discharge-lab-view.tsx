import { Card } from '@hos/nova-ui';
import type { DischargeLabWidgetProps } from './types';

export function DischargeLabWidget({
  patientId,
  compactMode,
  className,
}: DischargeLabWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Discharge & Lab</h3>
        <p className="text-body text-ink-2">Curated workflow for Discharge & Lab.</p>
      </div>
    </Card>
  );
}
