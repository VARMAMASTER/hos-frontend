import { Card } from '@hos/nova-ui';
import type { AskWidgetProps } from './types';

export function AskWidget({
  patientId,
  compactMode,
  className,
}: AskWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Ask Anything</h3>
        <p className="text-body text-ink-2">Curated workflow for Ask Anything.</p>
      </div>
    </Card>
  );
}
