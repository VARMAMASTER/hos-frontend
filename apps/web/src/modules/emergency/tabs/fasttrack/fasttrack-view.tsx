import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { FasttrackWidgetProps } from './types';

export function FasttrackWidget({
  patientId,
  compactMode,
  className,
}: FasttrackWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Fast Track"
        description="Curated workflow for Fast Track."
      />
      <TabContent>
        {/* Curated Emergency & Casualty - Fast Track workflow payload */}
      </TabContent>
    </TabPage>
  );
}
