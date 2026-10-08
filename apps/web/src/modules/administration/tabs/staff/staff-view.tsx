import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { StaffWidgetProps } from './types';

export function StaffWidget({
  patientId,
  compactMode,
  className,
}: StaffWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Staff & Roles"
        description="Curated workflow for Staff & Roles."
      />
      <TabContent>
        {/* Curated Administration - Staff & Roles workflow payload */}
      </TabContent>
    </TabPage>
  );
}
