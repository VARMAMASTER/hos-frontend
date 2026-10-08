import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { PatientsWidgetProps } from './types';

export function PatientsWidget({
  patientId,
  compactMode,
  className,
}: PatientsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="My Patients"
        description="Curated workflow for My Patients."
      />
      <TabContent>
        {/* Curated Ward Nursing - My Patients workflow payload */}
      </TabContent>
    </TabPage>
  );
}
