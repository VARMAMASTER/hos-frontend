import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { MlcWidgetProps } from './types';

export function MlcWidget({
  patientId,
  compactMode,
  className,
}: MlcWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="MLC Register"
        description="Curated workflow for MLC Register."
      />
      <TabContent>
        {/* Curated Emergency & Casualty - MLC Register workflow payload */}
      </TabContent>
    </TabPage>
  );
}
