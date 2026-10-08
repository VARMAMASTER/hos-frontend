import { Card } from '@hos/nova-ui';
import type { SettlementWidgetProps } from './types';

export function SettlementWidget({
  patientId,
  compactMode,
  className,
}: SettlementWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Settlement & Deductions</h3>
        <p className="text-body text-ink-2">Curated workflow for Settlement & Deductions.</p>
      </div>
    </Card>
  );
}
