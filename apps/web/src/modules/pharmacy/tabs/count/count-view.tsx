import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { CountWidgetProps } from './types';

export function CountWidget({
  patientId,
  compactMode,
  className,
}: CountWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Count & Variance"
        description="Curated workflow for Count & Variance."
      />
      <TabContent>
        {/* Curated Pharmacy & Dispense - Count & Variance workflow payload */}
      </TabContent>
    </TabPage>
  );
}
