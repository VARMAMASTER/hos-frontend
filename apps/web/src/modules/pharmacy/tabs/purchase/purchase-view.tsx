import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { PurchaseWidgetProps } from './types';

export function PurchaseWidget({
  patientId,
  compactMode,
  className,
}: PurchaseWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Purchase & GRN"
        description="Curated workflow for Purchase & GRN."
      />
      <TabContent>
        {/* Curated Pharmacy & Dispense - Purchase & GRN workflow payload */}
      </TabContent>
    </TabPage>
  );
}
