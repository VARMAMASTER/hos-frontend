import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ExpiryWidgetProps } from './types';

export function ExpiryWidget({
  patientId,
  compactMode,
  className,
}: ExpiryWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Expiry & FEFO"
        description="Curated workflow for Expiry & FEFO."
      />
      <TabContent>
        {/* Curated Pharmacy & Dispense - Expiry & FEFO workflow payload */}
      </TabContent>
    </TabPage>
  );
}
