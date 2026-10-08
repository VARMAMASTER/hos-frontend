import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { TrainingWidgetProps } from './types';

export function TrainingWidget({
  patientId,
  compactMode,
  className,
}: TrainingWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Training Sandbox"
        description="Curated workflow for Training Sandbox."
      />
      <TabContent>
        {/* Curated Administration - Training Sandbox workflow payload */}
      </TabContent>
    </TabPage>
  );
}
