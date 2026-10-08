import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { FillrateWidgetProps } from './types';

export function FillrateWidget({
  patientId,
  compactMode,
  className,
}: FillrateWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Fill Rate & Lost Sales"
        description="Curated workflow for Fill Rate & Lost Sales."
      />
      <TabContent>
        {/* Curated Pharmacy & Dispense - Fill Rate & Lost Sales workflow payload */}
      </TabContent>
    </TabPage>
  );
}
