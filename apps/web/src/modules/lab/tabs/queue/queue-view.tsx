import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { QueueWidgetProps } from './types';

export function QueueWidget({
  patientId,
  compactMode,
  className,
}: QueueWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Order Queue"
        description="Curated workflow for Order Queue."
      />
      <TabContent>
        {/* Curated Laboratory & Diagnostics - Order Queue workflow payload */}
      </TabContent>
    </TabPage>
  );
}
