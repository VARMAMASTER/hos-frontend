import { Card } from '@hos/nova-ui';
import type { BedboardWidgetProps } from './types';

export function BedboardWidget({
  patientId,
  compactMode,
  className,
}: BedboardWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Bed Board</h3>
        <p className="text-body text-ink-2">Curated workflow for Bed Board.</p>
      </div>
    </Card>
  );
}
