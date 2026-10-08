import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AiteamWidgetProps } from './types';

export function AiteamWidget({
  patientId,
  compactMode,
  className,
}: AiteamWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="My AI Team"
        description="Curated workflow for My AI Team."
      />
      <TabContent>
        {/* Curated Doctor Workspace - My AI Team workflow payload */}
      </TabContent>
    </TabPage>
  );
}
