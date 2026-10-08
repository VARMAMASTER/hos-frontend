import { Card } from '@hos/nova-ui';
import type { ChecklistWidgetProps } from './types';

export function ChecklistWidget({
  patientId,
  compactMode,
  className,
}: ChecklistWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Safety Checklist</h3>
        <p className="text-body text-ink-2">Curated workflow for Safety Checklist.</p>
      </div>
    </Card>
  );
}
