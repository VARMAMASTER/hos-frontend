import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AdvancesWidgetProps } from './types';

export function AdvancesWidget({
  patientId,
  compactMode,
  className,
}: AdvancesWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Advances & Packages"
        description="Curated workflow for Advances & Packages."
      />
      <TabContent>
        {/* Curated Billing & Cashier - Advances & Packages workflow payload */}
      </TabContent>
    </TabPage>
  );
}
