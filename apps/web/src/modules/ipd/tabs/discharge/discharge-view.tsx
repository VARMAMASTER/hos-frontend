import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { DischargeWidgetProps } from './types';

export function DischargeWidget({
  patientId,
  compactMode,
  className,
}: DischargeWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Discharge"
        description="Curated workflow for Discharge."
      />
      <TabContent>
        {/* Curated Inpatient (IPD) - Discharge workflow payload */}
      </TabContent>
    </TabPage>
  );
}
