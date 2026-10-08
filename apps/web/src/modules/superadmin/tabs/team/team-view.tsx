import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { TeamWidgetProps } from './types';

export function TeamWidget({
  patientId,
  compactMode,
  className,
}: TeamWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="HOS Team"
        description="Curated workflow for HOS Team."
      />
      <TabContent>
        {/* Curated HOS HQ Superadmin - HOS Team workflow payload */}
      </TabContent>
    </TabPage>
  );
}
