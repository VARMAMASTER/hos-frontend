import { Card } from '@hos/nova-ui';
import type { CensusWidgetProps } from './types';

export function CensusWidget({
  patientId,
  compactMode,
  className,
}: CensusWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Census & Occupancy</h3>
        <p className="text-body text-ink-2">Curated workflow for Census & Occupancy.</p>
      </div>
    </Card>
  );
}
