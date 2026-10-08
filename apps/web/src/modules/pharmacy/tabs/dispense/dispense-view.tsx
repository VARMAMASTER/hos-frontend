import { Card } from '@hos/nova-ui';
import type { DispenseWidgetProps } from './types';

export function DispenseWidget({
  patientId,
  compactMode,
  className,
}: DispenseWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Dispense Queue</h3>
        <p className="text-body text-ink-2">Curated workflow for Dispense Queue.</p>
      </div>
    </Card>
  );
}
