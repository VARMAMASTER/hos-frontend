import { Card } from '@hos/nova-ui';
import type { ClaimsWidgetProps } from './types';

export function ClaimsWidget({
  patientId,
  compactMode,
  className,
}: ClaimsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Claims & Pre-auth</h3>
        <p className="text-body text-ink-2">Curated workflow for Claims & Pre-auth.</p>
      </div>
    </Card>
  );
}
