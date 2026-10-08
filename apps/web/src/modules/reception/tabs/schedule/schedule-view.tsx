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
        title="Day Schedule"
        description="Curated workflow for Day Schedule."
      />
      <TabContent>
        {/* Curated Reception / OPD - Day Schedule workflow payload */}
      </TabContent>
    </TabPage>
  );
}
