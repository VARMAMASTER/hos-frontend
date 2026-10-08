import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { VitalsWidgetProps } from './types';

export function VitalsWidget({
  patientId,
  compactMode,
  className,
}: VitalsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Vitals & Charting"
        description="Curated workflow for Vitals & Charting."
      />
      <TabContent>
        {/* Curated Ward Nursing - Vitals & Charting workflow payload */}
      </TabContent>
    </TabPage>
  );
}
