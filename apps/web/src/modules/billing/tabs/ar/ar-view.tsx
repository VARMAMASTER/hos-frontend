import { Card } from '@hos/nova-ui';
import type { ArWidgetProps } from './types';

export function ArWidget({
  patientId,
  compactMode,
  className,
}: ArWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Outstanding (AR)</h3>
        <p className="text-body text-ink-2">Curated workflow for Outstanding (AR).</p>
      </div>
    </Card>
  );
}
