import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { MasterWidgetProps } from './types';

export function MasterWidget({
  patientId,
  compactMode,
  className,
}: MasterWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Drug Master"
        description="Curated workflow for Drug Master."
      />
      <TabContent>
        {/* Curated Pharmacy & Dispense - Drug Master workflow payload */}
      </TabContent>
    </TabPage>
  );
}
