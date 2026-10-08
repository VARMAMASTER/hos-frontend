import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { CriticalWidgetProps } from './types';

export function CriticalWidget({
  patientId,
  compactMode,
  className,
}: CriticalWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Critical Results"
        description="Curated workflow for Critical Results."
      />
      <TabContent>
        {/* Curated Laboratory & Diagnostics - Critical Results workflow payload */}
      </TabContent>
    </TabPage>
  );
}
