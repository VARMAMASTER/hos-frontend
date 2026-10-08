import { Card } from '@hos/nova-ui';
import type { TeamWidgetProps } from './types';

export function TeamWidget({
  patientId,
  compactMode,
  className,
}: TeamWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">HOS Team</h3>
        <p className="text-body text-ink-2">Curated workflow for HOS Team.</p>
      </div>
    </Card>
  );
}
