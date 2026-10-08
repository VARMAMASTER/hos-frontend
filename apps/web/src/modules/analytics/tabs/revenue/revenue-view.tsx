import { Card } from '@hos/nova-ui';
import type { RevenueWidgetProps } from './types';

export function RevenueWidget({
  patientId,
  compactMode,
  className,
}: RevenueWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Revenue Trends</h3>
        <p className="text-body text-ink-2">Curated workflow for Revenue Trends.</p>
      </div>
    </Card>
  );
}
