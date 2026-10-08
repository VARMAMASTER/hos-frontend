import { Card } from '@hos/nova-ui';
import type { MedsWidgetProps } from './types';

export function MedsWidget({
  patientId,
  compactMode,
  className,
}: MedsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Medication Round</h3>
        <p className="text-body text-ink-2">Curated workflow for Medication Round.</p>
      </div>
    </Card>
  );
}
