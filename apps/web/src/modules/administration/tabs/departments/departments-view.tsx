import { Card } from '@hos/nova-ui';
import type { DepartmentsWidgetProps } from './types';

export function DepartmentsWidget({
  patientId,
  compactMode,
  className,
}: DepartmentsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Departments</h3>
        <p className="text-body text-ink-2">Curated workflow for Departments.</p>
      </div>
    </Card>
  );
}
