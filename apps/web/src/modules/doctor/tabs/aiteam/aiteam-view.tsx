import { Card } from '@hos/nova-ui';
import type { AiteamWidgetProps } from './types';

export function AiteamWidget({
  patientId,
  compactMode,
  className,
}: AiteamWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">My AI Team</h3>
        <p className="text-body text-ink-2">Curated workflow for My AI Team.</p>
      </div>
    </Card>
  );
}
