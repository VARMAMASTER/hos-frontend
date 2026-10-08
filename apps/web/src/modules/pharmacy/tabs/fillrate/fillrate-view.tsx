import { Card } from '@hos/nova-ui';
import type { FillrateWidgetProps } from './types';

export function FillrateWidget({
  patientId,
  compactMode,
  className,
}: FillrateWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Fill Rate & Lost Sales</h3>
        <p className="text-body text-ink-2">Curated workflow for Fill Rate & Lost Sales.</p>
      </div>
    </Card>
  );
}
