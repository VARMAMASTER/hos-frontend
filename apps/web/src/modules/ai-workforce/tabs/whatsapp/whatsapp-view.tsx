import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { WhatsappWidgetProps } from './types';

export function WhatsappWidget({
  patientId,
  compactMode,
  className,
}: WhatsappWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="WhatsApp Assistant"
        description="Curated workflow for WhatsApp Assistant."
      />
      <TabContent>
        {/* Curated AI Workforce Fleet - WhatsApp Assistant workflow payload */}
      </TabContent>
    </TabPage>
  );
}
