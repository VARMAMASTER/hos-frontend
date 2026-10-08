import { Card } from '@hos/nova-ui';
import type { TrackingWidgetProps } from './types';

export function TrackingWidget({
  patientId,
  compactMode,
  className,
}: TrackingWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Sample Tracking</h3>
        <p className="text-body text-ink-2">Curated workflow for Sample Tracking.</p>
      </div>
    </Card>
  );
}
