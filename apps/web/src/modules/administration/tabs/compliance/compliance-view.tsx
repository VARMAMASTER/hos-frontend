import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ComplianceWidgetProps } from './types';

export function ComplianceWidget({
  patientId,
  compactMode,
  className,
}: ComplianceWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Compliance & NABH"
        description="Curated workflow for Compliance & NABH."
      />
      <TabContent>
        {/* Curated Administration - Compliance & NABH workflow payload */}
      </TabContent>
    </TabPage>
  );
}
