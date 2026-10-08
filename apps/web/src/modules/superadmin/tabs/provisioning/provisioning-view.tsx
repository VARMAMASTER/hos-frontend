import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ProvisioningWidgetProps } from './types';

export function ProvisioningWidget({
  patientId,
  compactMode,
  className,
}: ProvisioningWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Provisioning"
        description="Curated workflow for Provisioning."
      />
      <TabContent>
        {/* Curated HOS HQ Superadmin - Provisioning workflow payload */}
      </TabContent>
    </TabPage>
  );
}
