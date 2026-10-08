import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { PlansWidgetProps } from './types';

export function PlansWidget({
  patientId,
  compactMode,
  className,
}: PlansWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Plans & Pricing"
        description="Curated workflow for Plans & Pricing."
      />
      <TabContent>
        {/* Curated HOS HQ Superadmin - Plans & Pricing workflow payload */}
      </TabContent>
    </TabPage>
  );
}
