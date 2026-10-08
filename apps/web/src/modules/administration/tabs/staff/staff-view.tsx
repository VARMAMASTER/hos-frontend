import { Card } from '@hos/nova-ui';
import type { StaffWidgetProps } from './types';

export function StaffWidget({
  patientId,
  compactMode,
  className,
}: StaffWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Staff & Roles</h3>
        <p className="text-body text-ink-2">Curated workflow for Staff & Roles.</p>
      </div>
    </Card>
  );
}
