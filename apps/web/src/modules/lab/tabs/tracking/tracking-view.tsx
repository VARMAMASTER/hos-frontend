import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { TrackingWidgetProps } from './types';

export function TrackingWidget({
  patientId,
  compactMode,
  className,
}: TrackingWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Sample Tracking"
        description="Curated workflow for Sample Tracking."
      />
      <TabContent>
        {/* Curated Laboratory & Diagnostics - Sample Tracking workflow payload */}
      </TabContent>
    </TabPage>
  );
}
