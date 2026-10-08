import { Card } from '@hos/nova-ui';
import type { CodingWidgetProps } from './types';

export function CodingWidget({
  patientId,
  compactMode,
  className,
}: CodingWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Coding & Claims</h3>
        <p className="text-body text-ink-2">Curated workflow for Coding & Claims.</p>
      </div>
    </Card>
  );
}
