import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { StoresWidgetProps } from './types';

export function StoresWidget({
  patientId,
  compactMode,
  className,
}: StoresWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Stores & Transfers"
        description="Curated workflow for Stores & Transfers."
      />
      <TabContent>
        {/* Curated Pharmacy & Dispense - Stores & Transfers workflow payload */}
      </TabContent>
    </TabPage>
  );
}
