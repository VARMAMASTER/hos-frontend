import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { CensusWidgetProps } from './types';

export function CensusWidget({
  patientId,
  compactMode,
  className,
}: CensusWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Census & Occupancy"
        description="Curated workflow for Census & Occupancy."
      />
      <TabContent>
        {/* Curated Analytics & Insights - Census & Occupancy workflow payload */}
      </TabContent>
    </TabPage>
  );
}
