import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { InsightsWidgetProps } from './types';

export function InsightsWidget({
  patientId,
  compactMode,
  className,
}: InsightsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="AI Insights"
        description="Curated workflow for AI Insights."
      />
      <TabContent>
        {/* Curated Doctor Workspace - AI Insights workflow payload */}
      </TabContent>
    </TabPage>
  );
}
