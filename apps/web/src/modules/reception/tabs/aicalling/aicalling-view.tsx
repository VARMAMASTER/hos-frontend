import { TabPage, TabHeader, TabContent } from '@hos/nova-ui';
import type { AicallingWidgetProps } from './types';

export function AicallingWidget({
  patientId,
  compactMode,
  className,
}: AicallingWidgetProps) {
  return (
    <TabPage
      patientId={patientId}
      compactMode={compactMode}
      className={className}
    >
      <TabHeader
        title="AI Calling"
        description="Curated workflow for AI Calling."
      />
      <TabContent>
        {/* Curated Reception / OPD - AI Calling workflow payload */}
      </TabContent>
    </TabPage>
  );
}
