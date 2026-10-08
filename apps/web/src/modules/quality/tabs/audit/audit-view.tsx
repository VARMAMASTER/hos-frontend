import { Card } from '@hos/nova-ui';
import type { AuditWidgetProps } from './types';

export function AuditWidget({
  patientId,
  compactMode,
  className,
}: AuditWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Clinical Audit</h3>
        <p className="text-body text-ink-2">Curated workflow for Clinical Audit.</p>
      </div>
    </Card>
  );
}
