import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AuditWidgetProps } from './types';

export function AuditWidget({
  patientId,
  compactMode,
  className,
}: AuditWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Audit Log"
        description="Curated workflow for Audit Log."
      />
      <TabContent>
        {/* Curated Administration - Audit Log workflow payload */}
      </TabContent>
    </TabPage>
  );
}
