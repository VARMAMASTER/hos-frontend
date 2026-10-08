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
        title="My Queue"
        description="Curated workflow for My Queue."
      />
      <TabContent>
        {/* Curated Doctor Workspace - My Queue workflow payload */}
      </TabContent>
    </TabPage>
  );
}
