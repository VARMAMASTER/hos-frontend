import { Card } from '@hos/nova-ui';
import type { BreakglassWidgetProps } from './types';

export function BreakglassWidget({
  patientId,
  compactMode,
  className,
}: BreakglassWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Break-glass Log</h3>
        <p className="text-body text-ink-2">Curated workflow for Break-glass Log.</p>
      </div>
    </Card>
  );
}
