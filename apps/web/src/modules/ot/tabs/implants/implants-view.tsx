import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { ImplantsWidgetProps } from './types';

export function ImplantsWidget({
  patientId,
  compactMode,
  className,
}: ImplantsWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="Implants"
        description="Curated workflow for Implants."
      />
      <TabContent>
        {/* Curated Operation Theatre - Implants workflow payload */}
      </TabContent>
    </TabPage>
  );
}
