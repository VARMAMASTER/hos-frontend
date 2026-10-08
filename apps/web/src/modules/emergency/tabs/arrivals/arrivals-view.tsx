import { Card } from '@hos/nova-ui';
import type { ArrivalsWidgetProps } from './types';

export function ArrivalsWidget({
  patientId,
  compactMode,
  className,
}: ArrivalsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Arrivals</h3>
        <p className="text-body text-ink-2">Curated workflow for Arrivals.</p>
      </div>
    </Card>
  );
}
