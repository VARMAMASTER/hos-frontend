import { Card } from '@hos/nova-ui';
import type { HandoverWidgetProps } from './types';

export function HandoverWidget({
  patientId,
  compactMode,
  className,
}: HandoverWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Shift Handover</h3>
        <p className="text-body text-ink-2">Curated workflow for Shift Handover.</p>
      </div>
    </Card>
  );
}
