import { Card } from '@hos/nova-ui';
import type { ExpiryWidgetProps } from './types';

export function ExpiryWidget({
  patientId,
  compactMode,
  className,
}: ExpiryWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Expiry & FEFO</h3>
        <p className="text-body text-ink-2">Curated workflow for Expiry & FEFO.</p>
      </div>
    </Card>
  );
}
