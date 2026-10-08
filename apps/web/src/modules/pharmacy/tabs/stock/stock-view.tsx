import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { StockWidgetProps } from './types';

export function StockWidget({
  patientId,
  compactMode,
  className,
}: StockWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Stock & Batches"
        description="Curated workflow for Stock & Batches."
      />
      <TabContent>
        {/* Curated Pharmacy & Dispense - Stock & Batches workflow payload */}
      </TabContent>
    </TabPage>
  );
}
