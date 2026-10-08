import { Card } from '@hos/nova-ui';
import type { IcuWidgetProps } from './types';

export function IcuWidget({
  patientId,
  compactMode,
  className,
}: IcuWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">ICU & Emergency</h3>
        <p className="text-body text-ink-2">Curated workflow for ICU & Emergency.</p>
      </div>
    </Card>
  );
}
