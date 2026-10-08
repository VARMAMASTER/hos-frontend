import { Card } from '@hos/nova-ui';
import type { PreauthWidgetProps } from './types';

export function PreauthWidget({
  patientId,
  compactMode,
  className,
}: PreauthWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Pre-auth & Enhancement</h3>
        <p className="text-body text-ink-2">Curated workflow for Pre-auth & Enhancement.</p>
      </div>
    </Card>
  );
}
