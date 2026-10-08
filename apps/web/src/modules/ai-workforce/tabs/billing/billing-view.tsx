import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { BillingWidgetProps } from './types';

export function BillingWidget({
  patientId,
  compactMode,
  className,
}: BillingWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Billing Agent"
        description="Curated workflow for Billing Agent."
      />
      <TabContent>
        {/* Curated AI Workforce Fleet - Billing Agent workflow payload */}
      </TabContent>
    </TabPage>
  );
}
