import { Card } from '@hos/nova-ui';
import type { AicallingWidgetProps } from './types';

export function AicallingWidget({
  patientId,
  compactMode,
  className,
}: AicallingWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">AI Calling</h3>
        <p className="text-body text-ink-2">Curated workflow for AI Calling.</p>
      </div>
    </Card>
  );
}
