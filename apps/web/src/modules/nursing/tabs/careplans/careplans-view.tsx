import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { CareplansWidgetProps } from './types';

export function CareplansWidget({
  patientId,
  compactMode,
  className,
}: CareplansWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Care Plans"
        description="Curated workflow for Care Plans."
      />
      <TabContent>
        {/* Curated Ward Nursing - Care Plans workflow payload */}
      </TabContent>
    </TabPage>
  );
}
