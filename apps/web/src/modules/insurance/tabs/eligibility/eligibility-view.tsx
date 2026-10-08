import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { EligibilityWidgetProps } from './types';

export function EligibilityWidget({
  patientId,
  compactMode,
  className,
}: EligibilityWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Eligibility"
        description="Curated workflow for Eligibility."
      />
      <TabContent>
        {/* Curated Insurance & Claims - Eligibility workflow payload */}
      </TabContent>
    </TabPage>
  );
}
