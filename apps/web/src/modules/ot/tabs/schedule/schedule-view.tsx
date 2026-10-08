import { Card } from '@hos/nova-ui';
import type { ScheduleWidgetProps } from './types';

export function ScheduleWidget({
  patientId,
  compactMode,
  className,
}: ScheduleWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">OT Schedule</h3>
        <p className="text-body text-ink-2">Curated workflow for OT Schedule.</p>
      </div>
    </Card>
  );
}
