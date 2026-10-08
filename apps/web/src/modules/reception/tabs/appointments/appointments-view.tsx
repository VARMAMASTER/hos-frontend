import { Card } from '@hos/nova-ui';
import type { AppointmentsWidgetProps } from './types';

export function AppointmentsWidget({
  patientId,
  compactMode,
  className,
}: AppointmentsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Appointments</h3>
        <p className="text-body text-ink-2">Curated workflow for Appointments.</p>
      </div>
    </Card>
  );
}
