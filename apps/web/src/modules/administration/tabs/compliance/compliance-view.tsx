import { Card } from '@hos/nova-ui';
import type { ComplianceWidgetProps } from './types';

export function ComplianceWidget({
  patientId,
  compactMode,
  className,
}: ComplianceWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Compliance & NABH</h3>
        <p className="text-body text-ink-2">Curated workflow for Compliance & NABH.</p>
      </div>
    </Card>
  );
}
