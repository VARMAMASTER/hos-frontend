import { Card } from '@hos/nova-ui';
import type { ReportsWidgetProps } from './types';

export function ReportsWidget({
  patientId,
  compactMode,
  className,
}: ReportsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Reports & Delivery</h3>
        <p className="text-body text-ink-2">Curated workflow for Reports & Delivery.</p>
      </div>
    </Card>
  );
}
