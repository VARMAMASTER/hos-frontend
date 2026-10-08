import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { RoiWidgetProps } from './types';

export function RoiWidget({
  patientId,
  compactMode,
  className,
}: RoiWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Return on HOS"
        description="Curated workflow for Return on HOS."
      />
      <TabContent>
        {/* Curated Analytics & Insights - Return on HOS workflow payload */}
      </TabContent>
    </TabPage>
  );
}
