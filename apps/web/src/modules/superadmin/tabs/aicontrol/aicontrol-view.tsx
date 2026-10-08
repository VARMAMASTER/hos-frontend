import { Card } from '@hos/nova-ui';
import type { AicontrolWidgetProps } from './types';

export function AicontrolWidget({
  patientId,
  compactMode,
  className,
}: AicontrolWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">AI Fleet Control</h3>
        <p className="text-body text-ink-2">Curated workflow for AI Fleet Control.</p>
      </div>
    </Card>
  );
}
