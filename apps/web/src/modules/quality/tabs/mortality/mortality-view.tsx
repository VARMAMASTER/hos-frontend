import { Card } from '@hos/nova-ui';
import type { MortalityWidgetProps } from './types';

export function MortalityWidget({
  patientId,
  compactMode,
  className,
}: MortalityWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Mortality Review</h3>
        <p className="text-body text-ink-2">Curated workflow for Mortality Review.</p>
      </div>
    </Card>
  );
}
