import { Card } from '@hos/nova-ui';
import type { StoresWidgetProps } from './types';

export function StoresWidget({
  patientId,
  compactMode,
  className,
}: StoresWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Stores & Transfers</h3>
        <p className="text-body text-ink-2">Curated workflow for Stores & Transfers.</p>
      </div>
    </Card>
  );
}
