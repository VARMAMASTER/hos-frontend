import { Card } from '@hos/nova-ui';
import type { EligibilityWidgetProps } from './types';

export function EligibilityWidget({
  patientId,
  compactMode,
  className,
}: EligibilityWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Eligibility</h3>
        <p className="text-body text-ink-2">Curated workflow for Eligibility.</p>
      </div>
    </Card>
  );
}
