import { Card } from '@hos/nova-ui';
import type { UsageWidgetProps } from './types';

export function UsageWidget({
  patientId,
  compactMode,
  className,
}: UsageWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Usage Metering</h3>
        <p className="text-body text-ink-2">Curated workflow for Usage Metering.</p>
      </div>
    </Card>
  );
}
