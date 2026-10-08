import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { MedicationWidgetProps } from './types';

export function MedicationWidget({
  patientId,
  compactMode,
  className,
}: MedicationWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Medication Safety"
        description="Curated workflow for Medication Safety."
      />
      <TabContent>
        {/* Curated Quality & Accreditation - Medication Safety workflow payload */}
      </TabContent>
    </TabPage>
  );
}
