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
        title="Clinical Audit"
        description="Curated workflow for Clinical Audit."
      />
      <TabContent>
        {/* Curated Quality & Accreditation - Clinical Audit workflow payload */}
      </TabContent>
    </TabPage>
  );
}
