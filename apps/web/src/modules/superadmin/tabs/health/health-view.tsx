import { Card } from '@hos/nova-ui';
import type { HealthWidgetProps } from './types';

export function HealthWidget({
  patientId,
  compactMode,
  className,
}: HealthWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">System Health</h3>
        <p className="text-body text-ink-2">Curated workflow for System Health.</p>
      </div>
    </Card>
  );
}
