import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { DispenseWidgetProps } from './types';

export function DispenseWidget({
  patientId,
  compactMode,
  className,
}: DispenseWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Dispense Queue"
        description="Curated workflow for Dispense Queue."
      />
      <TabContent>
        {/* Curated Pharmacy & Dispense - Dispense Queue workflow payload */}
      </TabContent>
    </TabPage>
  );
}
