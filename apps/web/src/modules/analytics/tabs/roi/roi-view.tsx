import { Card } from '@hos/nova-ui';
import type { RoiWidgetProps } from './types';

export function RoiWidget({
  patientId,
  compactMode,
  className,
}: RoiWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Return on HOS</h3>
        <p className="text-body text-ink-2">Curated workflow for Return on HOS.</p>
      </div>
    </Card>
  );
}
