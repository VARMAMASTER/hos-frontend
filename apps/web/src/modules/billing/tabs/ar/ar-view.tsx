import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ArWidgetProps } from './types';

export function ArWidget({
  patientId,
  compactMode,
  className,
}: ArWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Outstanding (AR)"
        description="Curated workflow for Outstanding (AR)."
      />
      <TabContent>
        {/* Curated Billing & Cashier - Outstanding (AR) workflow payload */}
      </TabContent>
    </TabPage>
  );
}
