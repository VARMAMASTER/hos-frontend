import { Card } from '@hos/nova-ui';
import type { OverviewWidgetProps } from './types';

export function OverviewWidget({
  patientId,
  compactMode,
  className,
}: OverviewWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Overview</h3>
        <p className="text-body text-ink-2">Curated workflow for Overview.</p>
      </div>
    </Card>
  );
}
