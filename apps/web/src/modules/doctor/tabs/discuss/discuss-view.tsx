import { Card } from '@hos/nova-ui';
import type { DiscussWidgetProps } from './types';

export function DiscussWidget({
  patientId,
  compactMode,
  className,
}: DiscussWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Case Discussion</h3>
        <p className="text-body text-ink-2">Curated workflow for Case Discussion.</p>
      </div>
    </Card>
  );
}
