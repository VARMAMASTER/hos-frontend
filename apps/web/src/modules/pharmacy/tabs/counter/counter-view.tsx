import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { CounterWidgetProps } from './types';

export function CounterWidget({
  patientId,
  compactMode,
  className,
}: CounterWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Counter Sale"
        description="Curated workflow for Counter Sale."
      />
      <TabContent>
        {/* Curated Pharmacy & Dispense - Counter Sale workflow payload */}
      </TabContent>
    </TabPage>
  );
}
