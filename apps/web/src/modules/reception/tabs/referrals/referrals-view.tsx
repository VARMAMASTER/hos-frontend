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
        title="Referrals"
        description="Curated workflow for Referrals."
      />
      <TabContent>
        {/* Curated Reception / OPD - Referrals workflow payload */}
      </TabContent>
    </TabPage>
  );
}
