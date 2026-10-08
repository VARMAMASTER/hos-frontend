import { Card } from '@hos/nova-ui';
import type { ConsultWidgetProps } from './types';

export function ConsultWidget({
  patientId,
  compactMode,
  className,
}: ConsultWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Consultation</h3>
        <p className="text-body text-ink-2">Curated workflow for Consultation.</p>
      </div>
    </Card>
  );
}
