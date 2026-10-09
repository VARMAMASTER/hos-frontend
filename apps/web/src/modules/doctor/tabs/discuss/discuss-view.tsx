import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { DiscussWidgetProps } from './types';

export function DiscussWidget({
  patientId,
  compactMode,
  className,
}: DiscussWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Case Discussion"
        description="Curated workflow for Case Discussion."
      />
      <TabContent>
        {/* Curated Doctor module - Case Discussion workflow payload */}
      </TabContent>
    </TabPage>
  );
}
