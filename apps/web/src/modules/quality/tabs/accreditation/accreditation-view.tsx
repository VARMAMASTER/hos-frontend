import { Card } from '@hos/nova-ui';
import type { AccreditationWidgetProps } from './types';

export function AccreditationWidget({
  patientId,
  compactMode,
  className,
}: AccreditationWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Accreditation</h3>
        <p className="text-body text-ink-2">Curated workflow for Accreditation.</p>
      </div>
    </Card>
  );
}
