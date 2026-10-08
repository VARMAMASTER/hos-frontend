import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { PatientviewWidgetProps } from './types';

export function PatientviewWidget({
  patientId,
  compactMode,
  className,
}: PatientviewWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Patient View"
        description="Curated workflow for Patient View."
      />
      <TabContent>
        {/* Curated Patient Records - Patient View workflow payload */}
      </TabContent>
    </TabPage>
  );
}
