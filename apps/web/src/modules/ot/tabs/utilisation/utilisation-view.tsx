import { Card } from '@hos/nova-ui';
import type { UtilisationWidgetProps } from './types';

export function UtilisationWidget({
  patientId,
  compactMode,
  className,
}: UtilisationWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">OT Utilisation</h3>
        <p className="text-body text-ink-2">Curated workflow for OT Utilisation.</p>
      </div>
    </Card>
  );
}
