import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { NursingWidgetProps } from './types';

export function NursingWidget({
  patientId,
  compactMode,
  className,
}: NursingWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Nursing Station"
        description="Curated workflow for Nursing Station."
      />
      <TabContent>
        {/* Curated Inpatient (IPD) - Nursing Station workflow payload */}
      </TabContent>
    </TabPage>
  );
}
