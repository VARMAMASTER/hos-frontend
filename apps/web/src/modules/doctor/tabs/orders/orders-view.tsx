import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { OrdersWidgetProps } from './types';

export function OrdersWidget({
  patientId,
  compactMode,
  className,
}: OrdersWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Orders & Rx"
        description="Curated workflow for Orders & Rx."
      />
      <TabContent>
        {/* Curated Doctor module - Orders & Rx workflow payload */}
      </TabContent>
    </TabPage>
  );
}
