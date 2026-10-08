import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { OverviewWidgetProps } from './types';

export function OverviewWidget({
  patientId,
  compactMode,
  className,
}: OverviewWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Overview"
        description="Curated workflow for Overview."
      />
      <TabContent>
        {/* Curated AI Workforce Fleet - Overview workflow payload */}
      </TabContent>
    </TabPage>
  );
}
