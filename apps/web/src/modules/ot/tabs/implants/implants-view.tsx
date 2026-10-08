import { Card } from '@hos/nova-ui';
import type { ImplantsWidgetProps } from './types';

export function ImplantsWidget({
  patientId,
  compactMode,
  className,
}: ImplantsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Implants</h3>
        <p className="text-body text-ink-2">Curated workflow for Implants.</p>
      </div>
    </Card>
  );
}
