import { Card } from '@hos/nova-ui';
import type { PlansWidgetProps } from './types';

export function PlansWidget({
  patientId,
  compactMode,
  className,
}: PlansWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Plans & Pricing</h3>
        <p className="text-body text-ink-2">Curated workflow for Plans & Pricing.</p>
      </div>
    </Card>
  );
}
