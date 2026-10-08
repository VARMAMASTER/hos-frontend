import { Card } from '@hos/nova-ui';
import type { StockWidgetProps } from './types';

export function StockWidget({
  patientId,
  compactMode,
  className,
}: StockWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Stock & Batches</h3>
        <p className="text-body text-ink-2">Curated workflow for Stock & Batches.</p>
      </div>
    </Card>
  );
}
