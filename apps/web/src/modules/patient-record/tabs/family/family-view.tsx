import { Card } from '@hos/nova-ui';
import type { FamilyWidgetProps } from './types';

export function FamilyWidget({
  patientId,
  compactMode,
  className,
}: FamilyWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Family & Consent</h3>
        <p className="text-body text-ink-2">Curated workflow for Family & Consent.</p>
      </div>
    </Card>
  );
}
