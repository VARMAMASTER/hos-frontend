import { Card } from '@hos/nova-ui';
import type { VitalsWidgetProps } from './types';

export function VitalsWidget({
  patientId,
  compactMode,
  className,
}: VitalsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Vitals & Charting</h3>
        <p className="text-body text-ink-2">Curated workflow for Vitals & Charting.</p>
      </div>
    </Card>
  );
}
