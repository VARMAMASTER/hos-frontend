import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ReportsWidgetProps } from './types';

export function ReportsWidget({
  patientId,
  compactMode,
  className,
}: ReportsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Reports & Delivery"
        description="Curated workflow for Reports & Delivery."
      />
      <TabContent>
        {/* Curated Laboratory & Diagnostics - Reports & Delivery workflow payload */}
      </TabContent>
    </TabPage>
  );
}
