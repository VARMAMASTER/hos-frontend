import { Card } from '@hos/nova-ui';
import type { HistoryWidgetProps } from './types';

export function HistoryWidget({
  patientId,
  compactMode,
  className,
}: HistoryWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Patient History</h3>
        <p className="text-body text-ink-2">Curated workflow for Patient History.</p>
      </div>
    </Card>
  );
}
