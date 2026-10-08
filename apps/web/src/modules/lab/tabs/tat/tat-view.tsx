import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { TatWidgetProps } from './types';

export function TatWidget({
  patientId,
  compactMode,
  className,
}: TatWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="TAT Intelligence"
        description="Curated workflow for TAT Intelligence."
      />
      <TabContent>
        {/* Curated Laboratory & Diagnostics - TAT Intelligence workflow payload */}
      </TabContent>
    </TabPage>
  );
}
