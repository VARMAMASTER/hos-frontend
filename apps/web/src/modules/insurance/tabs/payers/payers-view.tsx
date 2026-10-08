import { Card } from '@hos/nova-ui';
import type { PayersWidgetProps } from './types';

export function PayersWidget({
  patientId,
  compactMode,
  className,
}: PayersWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Payers & Contracts</h3>
        <p className="text-body text-ink-2">Curated workflow for Payers & Contracts.</p>
      </div>
    </Card>
  );
}
