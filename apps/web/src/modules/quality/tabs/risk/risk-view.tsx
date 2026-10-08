import { Card } from '@hos/nova-ui';
import type { RiskWidgetProps } from './types';

export function RiskWidget({
  patientId,
  compactMode,
  className,
}: RiskWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Risk Register</h3>
        <p className="text-body text-ink-2">Curated workflow for Risk Register.</p>
      </div>
    </Card>
  );
}
