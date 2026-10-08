import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { MedsWidgetProps } from './types';

export function MedsWidget({
  patientId,
  compactMode,
  className,
}: MedsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Medication Round"
        description="Curated workflow for Medication Round."
      />
      <TabContent>
        {/* Curated Ward Nursing - Medication Round workflow payload */}
      </TabContent>
    </TabPage>
  );
}
