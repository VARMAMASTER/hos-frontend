import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { GstWidgetProps } from './types';

export function GstWidget({
  patientId,
  compactMode,
  className,
}: GstWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="GST Invoices"
        description="Curated workflow for GST Invoices."
      />
      <TabContent>
        {/* Curated Billing & Cashier - GST Invoices workflow payload */}
      </TabContent>
    </TabPage>
  );
}
