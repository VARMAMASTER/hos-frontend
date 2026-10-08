import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { HandoverWidgetProps } from './types';

export function HandoverWidget({
  patientId,
  compactMode,
  className,
}: HandoverWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Shift Handover"
        description="Curated workflow for Shift Handover."
      />
      <TabContent>
        {/* Curated Ward Nursing - Shift Handover workflow payload */}
      </TabContent>
    </TabPage>
  );
}
