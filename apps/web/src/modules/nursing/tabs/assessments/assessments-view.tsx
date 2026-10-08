import { Card } from '@hos/nova-ui';
import type { AssessmentsWidgetProps } from './types';

export function AssessmentsWidget({
  patientId,
  compactMode,
  className,
}: AssessmentsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Assessments</h3>
        <p className="text-body text-ink-2">Curated workflow for Assessments.</p>
      </div>
    </Card>
  );
}
