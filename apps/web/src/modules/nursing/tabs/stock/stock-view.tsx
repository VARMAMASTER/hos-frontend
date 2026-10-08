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
        title="Ward Stock"
        description="Curated workflow for Ward Stock."
      />
      <TabContent>
        {/* Curated Ward Nursing - Ward Stock workflow payload */}
      </TabContent>
    </TabPage>
  );
}
