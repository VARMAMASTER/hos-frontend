import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { RecoveryWidgetProps } from './types';

export function RecoveryWidget({
  patientId,
  compactMode,
  className,
}: RecoveryWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Recovery (PACU)"
        description="Curated workflow for Recovery (PACU)."
      />
      <TabContent>
        {/* Curated Operation Theatre - Recovery (PACU) workflow payload */}
      </TabContent>
    </TabPage>
  );
}
