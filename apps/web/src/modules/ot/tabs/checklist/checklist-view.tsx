import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ChecklistWidgetProps } from './types';

export function ChecklistWidget({
  patientId,
  compactMode,
  className,
}: ChecklistWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Safety Checklist"
        description="Curated workflow for Safety Checklist."
      />
      <TabContent>
        {/* Curated Operation Theatre - Safety Checklist workflow payload */}
      </TabContent>
    </TabPage>
  );
}
