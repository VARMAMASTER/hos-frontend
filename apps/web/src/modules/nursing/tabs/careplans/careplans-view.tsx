import { Card } from '@hos/nova-ui';
import type { CareplansWidgetProps } from './types';

export function CareplansWidget({
  patientId,
  compactMode,
  className,
}: CareplansWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Care Plans</h3>
        <p className="text-body text-ink-2">Curated workflow for Care Plans.</p>
      </div>
    </Card>
  );
}
