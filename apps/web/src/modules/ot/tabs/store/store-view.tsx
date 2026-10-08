import { Card } from '@hos/nova-ui';
import type { StoreWidgetProps } from './types';

export function StoreWidget({
  patientId,
  compactMode,
  className,
}: StoreWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Theatre Store</h3>
        <p className="text-body text-ink-2">Curated workflow for Theatre Store.</p>
      </div>
    </Card>
  );
}
