import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { TenantsWidgetProps } from './types';

export function TenantsWidget({
  patientId,
  compactMode,
  className,
}: TenantsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Tenants"
        description="Curated workflow for Tenants."
      />
      <TabContent>
        {/* Curated HOS HQ Superadmin - Tenants workflow payload */}
      </TabContent>
    </TabPage>
  );
}
