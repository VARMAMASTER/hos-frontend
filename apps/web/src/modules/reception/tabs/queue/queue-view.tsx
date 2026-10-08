import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { QueueWidgetProps } from './types';

export function QueueWidget({
  patientId,
  compactMode,
  className,
}: QueueWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Live Queue"
        description="Curated workflow for Live Queue."
      />
      <TabContent>
        {/* Curated Reception / OPD - Live Queue workflow payload */}
      </TabContent>
    </TabPage>
  );
}
