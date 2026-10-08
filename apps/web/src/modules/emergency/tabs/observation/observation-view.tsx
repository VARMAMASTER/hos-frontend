import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ObservationWidgetProps } from './types';

export function ObservationWidget({
  patientId,
  compactMode,
  className,
}: ObservationWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Observation"
        description="Curated workflow for Observation."
      />
      <TabContent>
        {/* Curated Emergency & Casualty - Observation workflow payload */}
      </TabContent>
    </TabPage>
  );
}
