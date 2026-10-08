import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { PayersWidgetProps } from './types';

export function PayersWidget({
  patientId,
  compactMode,
  className,
}: PayersWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Payers & Contracts"
        description="Curated workflow for Payers & Contracts."
      />
      <TabContent>
        {/* Curated Insurance & Claims - Payers & Contracts workflow payload */}
      </TabContent>
    </TabPage>
  );
}
