import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AmbulanceWidgetProps } from './types';

export function AmbulanceWidget({
  patientId,
  compactMode,
  className,
}: AmbulanceWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Ambulance"
        description="Curated workflow for Ambulance."
      />
      <TabContent>
        {/* Curated Emergency & Casualty - Ambulance workflow payload */}
      </TabContent>
    </TabPage>
  );
}
