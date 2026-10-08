import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ConsultWidgetProps } from './types';

export function ConsultWidget({
  patientId,
  compactMode,
  className,
}: ConsultWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Consultation"
        description="Curated workflow for Consultation."
      />
      <TabContent>
        {/* Curated Doctor Workspace - Consultation workflow payload */}
      </TabContent>
    </TabPage>
  );
}
