import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { DischargeLabWidgetProps } from './types';

export function DischargeLabWidget({
  patientId,
  compactMode,
  className,
}: DischargeLabWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Discharge & Lab"
        description="Curated workflow for Discharge & Lab."
      />
      <TabContent>
        {/* Curated AI Workforce Fleet - Discharge & Lab workflow payload */}
      </TabContent>
    </TabPage>
  );
}
