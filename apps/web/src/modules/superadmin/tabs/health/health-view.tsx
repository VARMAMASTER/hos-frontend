import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { HealthWidgetProps } from './types';

export function HealthWidget({
  patientId,
  compactMode,
  className,
}: HealthWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="System Health"
        description="Curated workflow for System Health."
      />
      <TabContent>
        {/* Curated HOS HQ Superadmin - System Health workflow payload */}
      </TabContent>
    </TabPage>
  );
}
