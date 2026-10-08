import { Card } from '@hos/nova-ui';
import type { AgeingWidgetProps } from './types';

export function AgeingWidget({
  patientId,
  compactMode,
  className,
}: AgeingWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Ageing by Payer</h3>
        <p className="text-body text-ink-2">Curated workflow for Ageing by Payer.</p>
      </div>
    </Card>
  );
}
