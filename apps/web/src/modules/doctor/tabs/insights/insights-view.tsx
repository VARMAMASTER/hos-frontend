import { Card } from '@hos/nova-ui';
import type { InsightsWidgetProps } from './types';

export function InsightsWidget({
  patientId,
  compactMode,
  className,
}: InsightsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">AI Insights</h3>
        <p className="text-body text-ink-2">Curated workflow for AI Insights.</p>
      </div>
    </Card>
  );
}
