import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { RevenueWidgetProps } from './types';

export function RevenueWidget({
  patientId,
  compactMode,
  className,
}: RevenueWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Revenue Trends"
        description="Curated workflow for Revenue Trends."
      />
      <TabContent>
        {/* Curated Analytics & Insights - Revenue Trends workflow payload */}
      </TabContent>
    </TabPage>
  );
}
