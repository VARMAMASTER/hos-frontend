import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { BedboardWidgetProps } from './types';

export function BedboardWidget({
  patientId,
  compactMode,
  className,
}: BedboardWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Bed Board"
        description="Curated workflow for Bed Board."
      />
      <TabContent>
        {/* Curated Inpatient (IPD) - Bed Board workflow payload */}
      </TabContent>
    </TabPage>
  );
}
