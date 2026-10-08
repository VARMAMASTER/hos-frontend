import { Card } from '@hos/nova-ui';
import type { OrdersWidgetProps } from './types';

export function OrdersWidget({
  patientId,
  compactMode,
  className,
}: OrdersWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Orders & Rx</h3>
        <p className="text-body text-ink-2">Curated workflow for Orders & Rx.</p>
      </div>
    </Card>
  );
}
