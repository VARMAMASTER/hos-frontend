import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ReferralsWidgetProps } from './types';

export function ReferralsWidget({
  patientId,
  compactMode,
  className,
}: ReferralsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Referrals Out"
        description="Curated workflow for Referrals Out."
      />
      <TabContent>
        {/* Curated Doctor Workspace - Referrals Out workflow payload */}
      </TabContent>
    </TabPage>
  );
}
