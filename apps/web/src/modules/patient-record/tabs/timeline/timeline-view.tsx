import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { TimelineWidgetProps } from './types';

export function TimelineWidget({
  patientId,
  compactMode,
  className,
}: TimelineWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Timeline"
        description="Curated workflow for Timeline."
      />
      <TabContent>
        {/* Curated Patient Records - Timeline workflow payload */}
      </TabContent>
    </TabPage>
  );
}
