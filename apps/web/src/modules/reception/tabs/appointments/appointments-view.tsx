import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AppointmentsWidgetProps } from './types';

export function AppointmentsWidget({
  patientId,
  compactMode,
  className,
}: AppointmentsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Appointments"
        description="Curated workflow for Appointments."
      />
      <TabContent>
        {/* Curated Reception / OPD - Appointments workflow payload */}
      </TabContent>
    </TabPage>
  );
}
