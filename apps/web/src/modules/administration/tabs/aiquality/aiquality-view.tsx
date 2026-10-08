import { Card } from '@hos/nova-ui';
import type { AiqualityWidgetProps } from './types';

export function AiqualityWidget({
  patientId,
  compactMode,
  className,
}: AiqualityWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">AI Quality & Ethics</h3>
        <p className="text-body text-ink-2">Curated workflow for AI Quality & Ethics.</p>
      </div>
    </Card>
  );
}
