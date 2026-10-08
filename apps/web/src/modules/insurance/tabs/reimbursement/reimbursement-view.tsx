import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ReimbursementWidgetProps } from './types';

export function ReimbursementWidget({
  patientId,
  compactMode,
  className,
}: ReimbursementWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Reimbursement"
        description="Curated workflow for Reimbursement."
      />
      <TabContent>
        {/* Curated Insurance & Claims - Reimbursement workflow payload */}
      </TabContent>
    </TabPage>
  );
}
