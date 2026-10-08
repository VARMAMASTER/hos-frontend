import { Card } from '@hos/nova-ui';
import type { ReimbursementWidgetProps } from './types';

export function ReimbursementWidget({
  patientId,
  compactMode,
  className,
}: ReimbursementWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Reimbursement</h3>
        <p className="text-body text-ink-2">Curated workflow for Reimbursement.</p>
      </div>
    </Card>
  );
}
