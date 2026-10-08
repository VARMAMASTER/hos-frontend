import { Card } from '@hos/nova-ui';
import type { QueueWidgetProps } from './types';

export function QueueWidget({
  patientId,
  compactMode,
  className,
}: QueueWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Order Queue</h3>
        <p className="text-body text-ink-2">Curated workflow for Order Queue.</p>
      </div>
    </Card>
  );
}
