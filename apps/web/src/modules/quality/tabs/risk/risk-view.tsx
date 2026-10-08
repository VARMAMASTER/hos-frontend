import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { RiskWidgetProps } from './types';

export function RiskWidget({
  patientId,
  compactMode,
  className,
}: RiskWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Risk Register"
        description="Curated workflow for Risk Register."
      />
      <TabContent>
        {/* Curated Quality & Accreditation - Risk Register workflow payload */}
      </TabContent>
    </TabPage>
  );
}
