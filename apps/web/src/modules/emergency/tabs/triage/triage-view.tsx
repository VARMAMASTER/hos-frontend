import { Card } from '@hos/nova-ui';
import type { TriageWidgetProps } from './types';

export function TriageWidget({
  patientId,
  compactMode,
  className,
}: TriageWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Triage Board</h3>
        <p className="text-body text-ink-2">Curated workflow for Triage Board.</p>
      </div>
    </Card>
  );
}
