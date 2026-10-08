import { Card } from '@hos/nova-ui';
import type { ReleasesWidgetProps } from './types';

export function ReleasesWidget({
  patientId,
  compactMode,
  className,
}: ReleasesWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Release & Rollout</h3>
        <p className="text-body text-ink-2">Curated workflow for Release & Rollout.</p>
      </div>
    </Card>
  );
}
