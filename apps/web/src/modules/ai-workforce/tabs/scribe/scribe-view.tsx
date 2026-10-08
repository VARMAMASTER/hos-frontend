import { Card } from '@hos/nova-ui';
import type { ScribeWidgetProps } from './types';

export function ScribeWidget({
  patientId,
  compactMode,
  className,
}: ScribeWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">AI Scribe</h3>
        <p className="text-body text-ink-2">Curated workflow for AI Scribe.</p>
      </div>
    </Card>
  );
}
