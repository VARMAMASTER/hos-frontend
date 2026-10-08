import { Card } from '@hos/nova-ui';
import type { CssdWidgetProps } from './types';

export function CssdWidget({
  patientId,
  compactMode,
  className,
}: CssdWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Instruments & CSSD</h3>
        <p className="text-body text-ink-2">Curated workflow for Instruments & CSSD.</p>
      </div>
    </Card>
  );
}
