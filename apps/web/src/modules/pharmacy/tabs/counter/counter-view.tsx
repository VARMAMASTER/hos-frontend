import { Card } from '@hos/nova-ui';
import type { CounterWidgetProps } from './types';

export function CounterWidget({
  patientId,
  compactMode,
  className,
}: CounterWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Counter Sale</h3>
        <p className="text-body text-ink-2">Curated workflow for Counter Sale.</p>
      </div>
    </Card>
  );
}
