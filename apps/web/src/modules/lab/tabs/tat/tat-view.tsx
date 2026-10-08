import { Card } from '@hos/nova-ui';
import type { TatWidgetProps } from './types';

export function TatWidget({
  patientId,
  compactMode,
  className,
}: TatWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">TAT Intelligence</h3>
        <p className="text-body text-ink-2">Curated workflow for TAT Intelligence.</p>
      </div>
    </Card>
  );
}
