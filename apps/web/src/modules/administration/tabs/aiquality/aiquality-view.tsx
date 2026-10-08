import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AiqualityWidgetProps } from './types';

export function AiqualityWidget({
  patientId,
  compactMode,
  className,
}: AiqualityWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="AI Quality & Ethics"
        description="Curated workflow for AI Quality & Ethics."
      />
      <TabContent>
        {/* Curated Administration - AI Quality & Ethics workflow payload */}
      </TabContent>
    </TabPage>
  );
}
