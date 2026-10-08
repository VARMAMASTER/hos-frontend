import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { IncidentsWidgetProps } from './types';

export function IncidentsWidget({
  patientId,
  compactMode,
  className,
}: IncidentsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Incidents"
        description="Curated workflow for Incidents."
      />
      <TabContent>
        {/* Curated HOS HQ Superadmin - Incidents workflow payload */}
      </TabContent>
    </TabPage>
  );
}
