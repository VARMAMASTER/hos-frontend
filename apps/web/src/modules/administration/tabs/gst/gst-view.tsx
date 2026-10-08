import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { GstWidgetProps } from './types';

export function GstWidget({
  patientId,
  compactMode,
  className,
}: GstWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="GST & Templates"
        description="Curated workflow for GST & Templates."
      />
      <TabContent>
        {/* Curated Administration - GST & Templates workflow payload */}
      </TabContent>
    </TabPage>
  );
}
