import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ClaimsWidgetProps } from './types';

export function ClaimsWidget({
  patientId,
  compactMode,
  className,
}: ClaimsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Claims & Pre-auth"
        description="Curated workflow for Claims & Pre-auth."
      />
      <TabContent>
        {/* Curated Billing & Cashier - Claims & Pre-auth workflow payload */}
      </TabContent>
    </TabPage>
  );
}
