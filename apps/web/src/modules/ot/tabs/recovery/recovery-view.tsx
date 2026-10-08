import { Card } from '@hos/nova-ui';
import type { RecoveryWidgetProps } from './types';

export function RecoveryWidget({
  patientId,
  compactMode,
  className,
}: RecoveryWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Recovery (PACU)</h3>
        <p className="text-body text-ink-2">Curated workflow for Recovery (PACU).</p>
      </div>
    </Card>
  );
}
