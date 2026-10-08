import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { RegistersWidgetProps } from './types';

export function RegistersWidget({
  patientId,
  compactMode,
  className,
}: RegistersWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Statutory Registers"
        description="Curated workflow for Statutory Registers."
      />
      <TabContent>
        {/* Curated Pharmacy & Dispense - Statutory Registers workflow payload */}
      </TabContent>
    </TabPage>
  );
}
