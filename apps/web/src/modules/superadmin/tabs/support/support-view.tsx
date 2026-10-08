import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { SupportWidgetProps } from './types';

export function SupportWidget({
  patientId,
  compactMode,
  className,
}: SupportWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Tickets & Issues"
        description="Curated workflow for Tickets & Issues."
      />
      <TabContent>
        {/* Curated HOS HQ Superadmin - Tickets & Issues workflow payload */}
      </TabContent>
    </TabPage>
  );
}
