import { Card } from '@hos/nova-ui';
import type { SnapshotWidgetProps } from './types';

export function SnapshotWidget({
  patientId,
  compactMode,
  className,
}: SnapshotWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Clinical Snapshot</h3>
        <p className="text-body text-ink-2">Curated workflow for Clinical Snapshot.</p>
      </div>
    </Card>
  );
}
