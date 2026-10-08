import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ScheduleWidgetProps } from './types';

export function ScheduleWidget({
  patientId,
  compactMode,
  className,
}: ScheduleWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="OT Schedule"
        description="Curated workflow for OT Schedule."
      />
      <TabContent>
        {/* Curated Operation Theatre - OT Schedule workflow payload */}
      </TabContent>
    </TabPage>
  );
}
