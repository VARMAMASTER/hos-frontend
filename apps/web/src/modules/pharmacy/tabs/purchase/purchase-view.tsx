import { Card } from '@hos/nova-ui';
import type { PurchaseWidgetProps } from './types';

export function PurchaseWidget({
  patientId,
  compactMode,
  className,
}: PurchaseWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Purchase & GRN</h3>
        <p className="text-body text-ink-2">Curated workflow for Purchase & GRN.</p>
      </div>
    </Card>
  );
}
